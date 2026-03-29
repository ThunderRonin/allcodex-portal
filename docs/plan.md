# Mermaid Relationship Diagrams for Lore Entries

Render interactive visual diagrams showing how lore entries relate to each other using the `beautiful-mermaid` package.

## Context

The portal already has:
- **`/ai/relationships` page** — uses `POST /api/ai/relationships` to get `RelationshipSuggestion[]` from AllKnower
- **`RelationshipSuggestion` type** — `{ targetNoteId, targetTitle, relationshipType, description }`
- **ETAPI `relation` attributes** — Trilium natively stores note-to-note relations
- **Lore detail page** (`/lore/[id]`) — displays attributes, tags, and content

The goal is to add a **visual graph diagram** on the lore detail page showing connections radiating from the current entry.

---

## Proposed Changes

### Dependencies

#### [NEW] Install `beautiful-mermaid`

```bash
bun add beautiful-mermaid
```

Synchronous SVG renderer — no DOM dependency, works with `useMemo`, supports dark themes.

---

### Reusable Component

#### [NEW] [MermaidDiagram.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/portal/MermaidDiagram.tsx)

A generic wrapper that takes a Mermaid DSL string and renders it as an SVG:

```tsx
import { renderMermaidSVG } from "beautiful-mermaid";
import { useMemo } from "react";

export function MermaidDiagram({ chart, theme }: { chart: string; theme?: string }) {
  const svg = useMemo(() => renderMermaidSVG(chart, { theme: theme ?? "dark" }), [chart, theme]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full overflow-x-auto" />;
}
```

---

### Lore Detail Integration

#### [NEW] [RelationshipGraph.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/portal/RelationshipGraph.tsx)

A client component placed on the lore detail page that:
1. Fetches the note's content, calls `POST /api/ai/relationships` to get suggestions.
2. Also reads the note's existing `relation`-type ETAPI attributes.
3. Merges both data sources into a single edge list.
4. Generates a Mermaid `graph LR` string from the edges.
5. Renders via `MermaidDiagram`.

**Mermaid DSL generation logic:**

```
graph LR
  A["Current Entry"] -->|ally| B["Gandalf"]
  A -->|location| C["Rivendell"]
  A -->|enemy| D["Sauron"]
```

Edge styling by `relationshipType`:
| Type | Color |
|---|---|
| ally | green |
| enemy | red |
| family | pink |
| location | blue |
| faction | purple |
| event | yellow |
| other | gray |

**UX:**
- Collapsed by default behind a "Show Relationship Map" button to avoid slow AI calls on every page load.
- Shows a loading skeleton while fetching.
- Clicking a node in the SVG navigates to `/lore/{noteId}` (via `<a>` tags in the Mermaid output or a click handler on the SVG).

#### [MODIFY] [page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/[id]/page.tsx)

Add the `<RelationshipGraph noteId={id} noteTitle={note.title} />` component below the Tags section.

---

### API Layer

#### [MODIFY] [route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/ai/relationships/route.ts)

No changes needed — the existing `POST /api/ai/relationships` endpoint already returns the data we need. We may add a `noteId` parameter so the backend can also pull Trilium relation attributes directly, but this is optional for v1.

---

## Data Flow

```mermaid
graph TD
  A[Lore Detail Page] -->|user clicks 'Show Map'| B[RelationshipGraph]
  B -->|POST /api/ai/relationships| C[AllKnower]
  B -->|GET /api/lore/:id| D[ETAPI - relation attrs]
  C -->|suggestions[]| E[Merge edges]
  D -->|relations[]| E
  E -->|Mermaid DSL string| F[MermaidDiagram]
  F -->|SVG| G[Rendered Graph]
```

---

## Verification Plan

### Automated
- `bun run build` — ensure no type errors with new dependency
- Browser test: navigate to a lore entry with known relationships, click "Show Map", confirm SVG renders

### Manual
- Verify node labels match entry titles
- Verify edge labels show relationship types
- Verify clicking a node navigates to the correct lore entry
- Verify the diagram renders correctly in dark mode
