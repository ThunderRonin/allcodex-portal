# Plan B: Template Picker UX + Category Tree + Draft/Published Toggle

> **Status: ✅ COMPLETED** — All three features shipped across pre-Phase A and Phase B work. See `components/editor/TemplatePicker.tsx`, `components/portal/LoreTree.tsx`, and `#draft` label toggle in the edit page.
> This document is retained as a historical design spec.

> Three independent UI features to bring the Portal's organizational capabilities up to parity with World Anvil.

---

## Background

The Portal's create page ([new/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/new/page.tsx)) currently uses a plain `<Select>` dropdown with 8 hardcoded lore types. There is no hierarchical navigation — the lore browser ([lore/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/page.tsx)) is a flat card grid. There is no draft/published state management.

AllCodex's ETAPI already supports full branch CRUD (`POST/GET/PATCH/DELETE /branches`), `notePosition` ordering, and `POST /refresh-note-ordering/{parentNoteId}`. Notes expose `childNoteIds` and `parentNoteIds`. All three features leverage existing backend capabilities.

---

## Feature 1: Template Selection UX

Replace the plain dropdown with a visual template picker and add missing worldbuilding templates.

---

### New Templates to Add in AllCodex

Add to [hidden_subtree_templates.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-core/apps/server/src/becca/hidden_subtree_templates.ts):

| Template | ID | Icon | Key Promoted Attributes |
|---|---|---|---|
| **Item / Artifact** | `_template_item` | `bx-diamond` | itemType, rarity, creator, magicProperties, history |
| **Spell / Magic** | `_template_spell` | `bx-meteor` | school, level, castingTime, range, components, duration |
| **Building / Structure** | `_template_building` | `bx-building-house` | buildingType, owner, purpose, condition, secrets |
| **Language / Script** | `_template_language` | `bx-font-family` | languageFamily, speakers, script, samplePhrase |

#### [MODIFY] [hidden_subtree_templates.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-core/apps/server/src/becca/hidden_subtree_templates.ts)

Add 4 new template definitions following the existing patterns (Character, Location, etc.). Each gets:
- `#template` label
- `#lore` label
- `#loreType = "<type>"` label
- Promoted attribute definitions via `label:fieldName = "promoted,alias=Display Name,single,text"` syntax
- A brief HTML content body with placeholder sections

---

### Portal Template Picker

#### [NEW] [TemplatePicker.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/TemplatePicker.tsx)

A dialog component triggered from the create page:

- **Layout**: 3-column grid of template cards inside a shadcn `Dialog`
- **Each card shows**: Icon, template name, 1-line description, key attributes preview
- **Hover**: Expands the card slightly with a gold border, shows the full description
- **Click**: Selects the template and closes the dialog, returning `{ loreType, templateId }`
- **Search**: Optional filter input at the top to narrow templates by name

Template data is defined as a static array in the component (matches the LORE_TYPES constant currently in [new/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/%28portal%29/lore/new/page.tsx) but enriched with descriptions and icons).

```tsx
const TEMPLATES = [
  {
    value: "character", label: "Character",
    icon: User, templateId: "_template_character",
    description: "A person, NPC, or notable individual in your world.",
    attributes: ["Race", "Role", "Status", "Goals"]
  },
  // ... 11 more
];
```

#### [MODIFY] [new/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/new/page.tsx)

- **Remove**: The `LORE_TYPES` constant and `<Select>` dropdown
- **Add**: "Choose Template" button that opens `<TemplatePicker />`
- **Add**: Selected template shown as a card preview (icon + name + description) below the button
- **Add**: Pass the `templateId` to the POST body so the API route can link the template via a `~template` relation
- **Keep**: Title input, parent note ID input, content editor (from Plan A)

#### [MODIFY] [api/lore/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/route.ts)

In the [POST](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/route.ts#18-37) handler, after creating the note and adding `#lore` + `#loreType` labels:

```typescript
// Link the template relation (best-effort)
if (templateId) {
  await createAttribute(creds, {
    noteId, type: "relation", name: "template", value: templateId
  }).catch(() => {}); // won't fail if template doesn't exist
}
```

---

## Feature 2: Category Tree Navigation

Add a sidebar tree view to the lore browser using `react-arborist`.

---

### Data Flow

The tree needs the note hierarchy from AllCodex. Each note's `childNoteIds` gives us children. We need a recursive fetch starting from a configurable lore root note.

#### [NEW] [tree/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/tree/route.ts)

New API endpoint that returns the full lore tree structure:

```
GET /api/lore/tree?root=<noteId>
Response: { tree: TreeNode[] }
```

Where `TreeNode`:
```typescript
interface TreeNode {
  id: string;          // noteId
  name: string;        // title
  loreType?: string;
  children?: TreeNode[];
  isLeaf: boolean;
}
```

Implementation:
1. Fetch the root note via ETAPI ([getNote(creds, rootId)](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts#99-104))
2. Recursively fetch children via `childNoteIds` (breadth-first, max depth 5)
3. For each child, extract `title`, `loreType` label, and its own children
4. Filter: only include notes with `#lore` label (skip system notes, templates, etc.)
5. Cache aggressively with 30s TTL (most trees won't change frequently)

> [!IMPORTANT]
> **Performance**: For large worlds (500+ notes), fetching each note individually via ETAPI is slow. A more efficient approach is to use ETAPI search `#lore` to get all lore notes in one call (already returns `parentNoteIds`), then build the tree client-side from the flat list. This is the recommended approach.

**Optimized implementation**:
1. `GET /api/lore?q=#lore` (already exists, returns up to 200 notes with attributes)
2. Portal-side: build tree from `parentNoteIds` field on each note
3. No new API route needed — just a client-side `buildTree()` utility

#### [NEW] [LoreTree.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/portal/LoreTree.tsx)

`react-arborist` tree component for the lore sidebar:

- **Data source**: TanStack Query fetching `/api/lore?q=#lore`, then `buildTree()` on the result
- **Rendering**: Custom node renderer showing icon (by loreType) + title + loreType badge
- **Click**: Navigate to `/lore/{noteId}`
- **Drag-and-drop**: Reparent a note by dropping it on a different parent node
  - On drop: call `POST /api/lore/move` to create a new branch and delete the old one
- **Context menu**: Right-click → "New child note", "Rename", "Delete"
- **Virtual rendering**: Built-in — react-arborist virtualizes large trees
- **Keyboard navigation**: Built-in — arrow keys, Enter to open, F2 to rename

#### [NEW] [move/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/move/route.ts)

Move a note to a different parent:

```
POST /api/lore/move
Body: { noteId, newParentId, position? }
Response: { branch: Branch }
```

Implementation:
1. Create a new branch via ETAPI: `POST /branches { noteId, parentNoteId: newParentId, notePosition }`
2. If the note was already under a different parent, the old branch auto-coexists (Trilium supports multi-parent)
3. If single-parent is desired: delete the old branch via `DELETE /branches/{oldBranchId}`
4. Call `POST /refresh-note-ordering/{newParentId}` to push position changes to sync

#### [MODIFY] [etapi-server.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts)

Add branch management functions:

```typescript
export async function createBranch(creds, params: {
  noteId: string; parentNoteId: string; notePosition?: number;
}): Promise<Branch>

export async function deleteBranch(creds, branchId: string): Promise<void>

export async function patchBranch(creds, branchId: string, patch: {
  notePosition?: number; prefix?: string;
}): Promise<Branch>

export async function refreshNoteOrdering(creds, parentNoteId: string): Promise<void>
```

#### [MODIFY] [lore/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/page.tsx)

Add the tree as a sidebar panel:

- **Layout**: Switch from full-width card grid to a **sidebar + main content** split
  - Left sidebar (280px): `<LoreTree />` with a "Collapse" toggle
  - Main area: existing card grid, now filtered by the selected tree node
- **Interaction**: Click a tree node → the card grid filters to that node's children (or navigates to the note detail)
- **Fallback**: If tree data fails to load, show the existing flat grid with no sidebar

---

## Feature 3: Draft/Published Toggle

Add a draft state for lore entries, hiding drafts from the public share page.

---

### Convention

- **Draft**: Note has the `#draft` label. Hidden from share rendering, visible in Portal.
- **Published**: No `#draft` label. Visible on share pages (unless `#gmOnly`).

This leverages the same pattern as `#gmOnly` and requires minimal backend changes.

#### [MODIFY] [content_renderer.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-core/apps/server/src/share/content_renderer.ts)

In the share content renderer, extend the existing `#gmOnly` check:

```diff
 // Hide GM-only notes
 if (note.hasLabel("gmOnly")) {
   return "";
 }
+// Hide draft notes from public share
+if (note.hasLabel("draft")) {
+  return "";
+}
```

#### [MODIFY] [edit/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/[id]/edit/page.tsx)

Add a Draft/Published toggle in the editor toolbar:

- **UI**: A `Switch` component (shadcn) labeled "Draft" / "Published" with an icon (eye / eye-off)
- **State**: Read the `#draft` label from the note's attributes on load
- **Save**: On toggle:
  - Published → Draft: `POST /api/lore/{id}/attributes` with `{ type: "label", name: "draft", value: "" }`
  - Draft → Published: `DELETE /api/lore/{id}/attributes/{draftAttributeId}`

#### [MODIFY] [lore/[id]/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/[id]/page.tsx)

Show a visual indicator:

- **Badge**: Next to the loreType badge, show a `<Badge variant="outline">Draft</Badge>` if the `#draft` label is present
- **Color**: Muted/amber to distinguish from the normal loreType badge

#### [NEW] [attributes/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/[id]/attributes/route.ts)

Generic attribute management endpoint (useful beyond just #draft):

```
POST /api/lore/{id}/attributes
Body: { type: "label"|"relation", name: string, value: string }
Response: { attributeId, ... }

DELETE /api/lore/{id}/attributes/{attributeId}
Response: 204
```

Wraps [createAttribute](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts#143-157) and a new `deleteAttribute` function in [etapi-server.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts).

#### [MODIFY] [etapi-server.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts)

Add:

```typescript
export async function deleteAttribute(creds: EtapiCreds, attributeId: string): Promise<void>
```

#### [MODIFY] [lore/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/page.tsx)

Add a "Drafts" filter tab alongside the existing loreType filter tabs:

- Shows notes with `#draft` label separated from published notes
- Default view shows published notes; "Drafts" tab shows drafts with an amber indicator

---

## Dependencies to Install

```bash
npm install react-arborist
```

No other new dependencies needed. All three features use existing shadcn/ui components.

---

## Verification Plan

### Feature 1 — Template Picker:
1. Navigate to `/lore/new`, click "Choose Template"
2. ✅ Verify the dialog opens with a 3-column grid of 12 template cards
3. ✅ Hover a card — verify it highlights with descriptions
4. ✅ Select "Spell" — verify it appears as the selected template below the button
5. ✅ Create the entry — verify the note is created with `#loreType=spell` AND `~template=_template_spell`

### Feature 2 — Category Tree:
1. Navigate to `/lore`
2. ✅ Verify a tree sidebar appears showing the lore hierarchy
3. ✅ Click a tree node — verify the card grid filters or navigates
4. ✅ Drag a note onto a different parent — verify the move persists (note appears under new parent on refresh)
5. ✅ Right-click a node → "New child note" → verify creation dialog opens with parent pre-filled

### Feature 3 — Draft/Published:
1. Open any lore entry's edit page
2. ✅ Verify the Draft/Published toggle appears
3. ✅ Toggle to "Draft" — verify a `#draft` label is added (check attributes in sidebar)
4. ✅ Navigate to the lore browser — verify the entry shows an amber "Draft" badge
5. ✅ Open the public share page — verify the draft entry is **not** visible
6. ✅ Toggle back to "Published" — verify the entry reappears on the share page
