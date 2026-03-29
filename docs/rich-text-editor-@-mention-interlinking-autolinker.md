# Plan A: Rich Text Editor + @-Mention Interlinking + Autolinker

> Replace the raw HTML textarea with a full WYSIWYG editor, add inline `@`-mention cross-referencing, and an autolinker command.

---

## Background

The Portal's edit page ([edit/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/[id]/edit/page.tsx)) currently uses a `<Textarea>` for raw HTML editing. The create page ([new/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/new/page.tsx)) has a plain text input. Content is stored as HTML in AllCodex via [etapi-server.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts) ([putNoteContent](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts#129-137) / [getNoteContent](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts#105-110)).

This plan replaces both with a [Novel](https://novel.sh) editor (Tiptap/ProseMirror-based) that provides slash commands, bubble menu, image upload, markdown shortcuts, and support for custom extensions.

---

## User Review Required

> [!IMPORTANT]
> **HTML round-tripping**: AllCodex stores content as HTML. Novel works natively with ProseMirror JSON. We will use `editor.getHTML()` to save and `editor.commands.setContent(html)` to load. This is lossless for standard formatting (bold, italic, headings, lists, tables, blockquotes, images, links) but any exotic Trilium-specific HTML (e.g. `<section class="include-note">`) will be preserved as raw HTML blocks by Tiptap. This is the correct behavior — no data loss.

> [!WARNING]
> **Image upload destination**: We need to decide where uploaded images go. Two options:
> 1. **AllCodex note attachments** — Create an `image` type note via ETAPI and use its URL. Keeps everything self-contained.
> 2. **Local filesystem / S3** — More conventional but adds infra.
>
> This plan assumes **Option 1** (AllCodex-native). Please confirm or adjust.

---

## Proposed Changes

### Phase 1: Novel Editor Component (Core)

The foundation — replace the textarea with a rich editor.

---

#### [NEW] [LoreEditor.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/LoreEditor.tsx)

The main editor component, wrapping Novel's `EditorContent`. Responsibilities:

- **Load**: Accept `initialContent` (HTML string), parse into editor on mount via `setContent(html)`
- **Save**: Debounced auto-save (750ms) calling `onSave(editor.getHTML())` callback
- **Save indicator**: "Saved" / "Saving..." / "Unsaved" badge in top-right
- **Slash menu**: Configure default Novel slash commands (headings, lists, quotes, code, horizontal rule, image upload)
- **Bubble menu**: Bold, italic, underline, strikethrough, link, highlight on text selection
- **Markdown shortcuts**: `#`, `##`, `---`, `**`, etc. (built-in via Tiptap StarterKit)
- **Extensions**: Accept additional Tiptap extensions via prop (for Phase 2's `@`-mention)

```tsx
// Simplified API
<LoreEditor
  initialContent={htmlString}
  onSave={(html: string) => putContent(html)}
  extensions={[mentionExtension]}  // Phase 2
  className="min-h-[400px]"
/>
```

---

#### [NEW] [extensions.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/extensions.ts)

Default Tiptap extensions list. Separating this from the component allows clean extension management:

- StarterKit (paragraphs, headings, bold, italic, lists, code, blockquotes)
- HorizontalRule with Novel's custom input rules (`---`, `—-`, `___`)
- TiptapLink (with auto-linking of pasted URLs)
- TiptapImage (with the upload plugin wired to Phase 1's upload handler)
- Placeholder ("Type '/' for commands, '@' to link another entry...")
- TiptapUnderline
- TextStyle + Highlight (multicolor)
- TaskList + TaskItem
- Table + TableRow + TableCell + TableHeader

---

#### [NEW] [slash-command.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/slash-command.tsx)

Slash command configuration using Novel's `createSuggestionItems` + `Command.configure`:

- Text, Heading 1/2/3, Bullet List, Numbered List, Quote, Code, To-do, Image Upload
- **Phase 3 addition**: Autolinker command

---

#### [NEW] [bubble-menu.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/bubble-menu.tsx)

Floating toolbar on text selection:

- Bold, Italic, Underline, Strikethrough, Code
- Link (input popover for URL)
- Highlight color

---

#### [NEW] [image-upload.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/image-upload.ts)

Custom upload handler that creates an image note in AllCodex via the Portal API:

1. `POST /api/lore/upload-image` with `FormData` containing the image file
2. The API route creates an `image` type note in AllCodex via ETAPI
3. Returns the URL: `/api/lore/{noteId}/content` (or AllCodex's direct image URL)
4. The URL is inserted into the editor as an `<img>` tag

---

#### [NEW] [upload-image/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/upload-image/route.ts)

New API route handling image upload:

```
POST /api/lore/upload-image
Content-Type: multipart/form-data
Body: { file: File }
Response: { url: string, noteId: string }
```

Implementation:
1. Read the uploaded file from the request
2. Call [createNote(creds, { parentNoteId: "root", title: filename, type: "image" })](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts#111-119) via ETAPI
3. `PUT /etapi/notes/{noteId}/content` with the raw image bytes
4. Return `{ url: "${allcodexUrl}/etapi/notes/${noteId}/content", noteId }`

---

#### [MODIFY] [edit/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/[id]/edit/page.tsx)

Replace the entire content editing section:

- **Remove**: `<Textarea>` for HTML content, manual save button click flow
- **Add**: `<LoreEditor>` with `initialContent={content}` and `onSave` wired to [putNoteContent](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts#129-137)
- **Keep**: Title `<Input>`, delete button, cancel/save buttons (save now calls `editor.getHTML()`)
- **Add**: Auto-save via debounced `onDebouncedUpdate` from Novel — save indicator replaces manual save

---

#### [MODIFY] [new/page.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/lore/new/page.tsx)

Replace the content textarea:

- **Remove**: `<Textarea>` for initial content
- **Add**: `<LoreEditor>` in a reduced-height mode for initial content authoring
- Content is extracted via `editor.getHTML()` before submission

---

#### [MODIFY] [globals.css](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/globals.css)

Add editor-specific styles:

- `.novel-editor` wrapper: match grimoire theme (dark bg, gold accents, Crimson Text font)
- Slash menu and bubble menu: dark popover styling matching `--popover` / `--popover-foreground`
- Placeholder text: muted gold color
- Focus ring: gold ring matching `--ring`
- The existing `.lore-content` styles should be extended to also apply inside the editor's `ProseMirror` div so editing and viewing look identical

---

### Phase 2: @-Mention Interlinking

Add `@` trigger to link other lore entries inline while writing.

---

#### [NEW] [mention-extension.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/mention-extension.tsx)

Custom Tiptap `Mention` extension:

- **Trigger**: `@` character
- **Search**: After typing 2+ chars, calls `GET /api/lore/mention-search?q={query}` (debounced 200ms)
- **Dropdown**: Renders a styled suggestion list showing: note title + loreType badge
- **Selection**: Inserts a styled link `<a href="/lore/{noteId}" data-mention="true" class="lore-mention">{title}</a>`
- **Rendering**: The mention renders as a styled inline chip/link in the editor (gold underline + icon)

The underlying Tiptap `Mention` extension handles keyboard navigation (arrow keys, enter) and positioning automatically.

---

#### [NEW] [mention-search/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/mention-search/route.ts)

Lightweight search endpoint optimized for the mention dropdown:

```
GET /api/lore/mention-search?q=ald
Response: [{ noteId, title, loreType }]  (max 8 results)
```

Implementation:
1. Call AllCodex ETAPI search: `#lore AND "${query}"` (title match)
2. Optionally also hit AllKnower autocomplete if available: `GET /suggest/autocomplete?q={query}`
3. Merge, deduplicate by noteId, return top 8
4. Return a slim payload (no content, no full attributes — just noteId, title, loreType)

---

#### [MODIFY] [etapi-server.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/lib/etapi-server.ts)

Add a new function:

```typescript
/** Quick title search for mention autocomplete (slim response) */
export async function searchNotesTitles(
  creds: EtapiCreds,
  query: string,
  limit = 8
): Promise<{ noteId: string; title: string; loreType?: string }[]>
```

This calls the same ETAPI search but extracts only the fields needed for the mention dropdown.

---

#### [MODIFY] [globals.css](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/globals.css)

Add mention styling:

```css
/* Mention links in editor and rendered content */
.lore-mention {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}
.lore-mention::before {
  content: "@";
  opacity: 0.5;
}
```

---

### Phase 3: Autolinker (Slash Command)

Scan the document for terms matching existing lore entries and offer to auto-link them.

---

#### [MODIFY] [slash-command.tsx](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/slash-command.tsx)

Add an "Autolink" item to the slash command menu:

```tsx
{
  title: "Autolinker",
  description: "Find and link mentions of existing lore entries.",
  searchTerms: ["autolink", "link", "connect"],
  icon: <Link2 size={18} />,
  command: ({ editor }) => runAutolinker(editor)
}
```

---

#### [NEW] [autolinker.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/components/editor/autolinker.ts)

The autolinker logic:

1. Extract plain text from the editor (`editor.getText()`)
2. Call `POST /api/lore/autolink` with the text
3. Backend returns `{ matches: [{ term, noteId, title, positions }] }`
4. For each match, show a confirmation popover/dialog listing all found terms
5. User checks/unchecks which ones to link
6. Apply: for each confirmed match, use `editor.chain().setMark('link', { href: '/lore/{noteId}' })` on the matching text ranges

---

#### [NEW] [autolink/route.ts](file:///Users/allmaker/projects/allcodex-aio/allcodex-portal/app/api/lore/autolink/route.ts)

Backend for the autolinker:

```
POST /api/lore/autolink
Body: { text: string }
Response: { matches: [{ term: string, noteId: string, title: string }] }
```

Implementation:
1. Fetch all lore note titles via ETAPI search `#lore` (cached server-side for performance)
2. For each title, case-insensitive search against the provided text
3. Filter out already-linked terms (caller can pass existing links)
4. Return matches sorted by text length (longest first to avoid substring conflicts)

---

### Dependencies to Install

```bash
npm install novel @tiptap/pm @tiptap/suggestion
```

Novel bundles Tiptap core, StarterKit, and most extensions. The above are the peer deps needed for custom extensions (mention, suggestion).

---

## Verification Plan

### Automated Tests

No tests currently exist in the portal. Creating a test framework is out of scope for this plan, but the following can be verified via the existing development workflow.

### Manual Verification

These steps require AllCodex to be running locally on port 8080 with sample lore data.

**Phase 1 — Editor**:
1. Run `npm run dev` in the portal
2. Navigate to `/lore` → click any existing entry → click "Edit"
3. ✅ Verify the Novel editor loads with the note's existing HTML content (headings, bold, lists should render correctly)
4. ✅ Type `/` — verify the slash command menu appears with options (Heading, List, Quote, Code, Image)
5. ✅ Select text — verify the bubble menu appears with formatting options
6. ✅ Type `---` — verify a horizontal rule is inserted
7. ✅ Make edits, wait 1 second — verify "Saving..." then "Saved" indicator
8. ✅ Navigate away and back — verify changes persisted
9. ✅ Navigate to `/lore/new` — verify the editor appears for new entry creation
10. ✅ Drag and drop an image into the editor — verify it uploads and renders inline

**Phase 2 — @-Mention**:
1. In the editor, type `@Ald` (assuming a lore entry starting with "Ald" exists)
2. ✅ Verify a dropdown appears with matching entries + loreType badges
3. ✅ Use arrow keys + Enter to select — verify a styled link is inserted
4. ✅ Click the inserted mention — verify it navigates to `/lore/{noteId}`
5. ✅ Save the note, view it on the detail page — verify the mention renders as a clickable link

**Phase 3 — Autolinker**:
1. Create a long-form lore entry mentioning other entries by name (e.g. "The Kingdom of Solaris was founded by Aldric")
2. Type `/autolinker` and select the command
3. ✅ Verify a confirmation dialog shows matched terms (e.g. "Solaris", "Aldric")
4. ✅ Click "Apply" — verify the terms become links to their respective lore entries
5. ✅ Save and re-open — verify the links persist

### edge cases to manually test
- Loading a note with no content (empty string)
- Loading a note with complex HTML (tables, blockquotes, code blocks)
- @-mention with no results (verify graceful empty state)
- Autolinker on a note with no matches (verify "No matches found" message)
- Image upload failure (verify error toast)
