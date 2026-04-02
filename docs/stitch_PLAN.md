# Full Portal Stitch Alignment Plan

## Summary
Implement a full redesign pass for `allcodex-portal` so the live DM-facing portal matches the existing `docs/stitch` references across shell, editor, library, workflow, and AI review surfaces. The work should preserve current route structure, data fetching, and API contracts, while replacing stock shadcn-style page composition with purpose-built portal components that encode the Stitch layouts and visual language.

## Implementation Changes
- Replace the generic portal shell in [layout.tsx](/Users/allmaker/projects/allcodex-aio/allcodex-portal/app/(portal)/layout.tsx) with a branded shared shell component system:
  - Persistent left rail and top navigation matching the Stitch structure.
  - Route-aware active states and per-section framing for Chronicle, Studio, AI Tools, System, Import, and utility links.
  - A small set of portal-specific layout primitives under `components/portal/` for page header, section rail, content canvas, and contextual action bars.
- Rework lore creation/edit into a dedicated “manuscript studio” flow:
  - Keep `/lore/new` and `/lore/[id]/edit` route behavior and mutation logic intact.
  - Replace the current card-and-sidebar composition with the Stitch manuscript layout: breadcrumb/top action bar, editorial canvas, contextual metadata rail, and stronger hierarchy around title, type/template, parent note, and promoted fields.
  - Refactor `LoreEditor` away from visibly stock `@blocknote/shadcn` presentation by wrapping/customizing it with portal-specific toolbar, typography, spacing, and suggestion surfaces so it reads as a designed editor, not a skinned default editor.
  - Keep current HTML persistence behavior and mention/image support unchanged.
- Rebuild high-gap feature screens using page-specific components derived from their Stitch mocks:
  - `statblocks/page.tsx`: two-pane library experience with left-side filter/list panel and richer detail/preview composition; upgrade `StatblockCardCompact` and `StatblockCard` to match the statblock viewer visual language.
  - `quests/page.tsx`: shift from generic card grid to board-style tracker with clear status columns and richer quest cards.
  - `settings/page.tsx`: replace generic settings cards/tabs with branded system console sections for AllCodex and AllKnower connection flows; preserve all current connection and auth actions.
  - `import/page.tsx`: split system-pack and Azgaar flows into a proper wizard-like import surface with step framing, upload zone, preview, selection, and result states.
  - `brain-dump/page.tsx` and `brain-dump/[id]/page.tsx`: redesign input, review, summary, warnings, and history/result cards so AI workflows match the Stitch review-results tone and hierarchy.
- Consolidate shared visual tokens and reusable portal components:
  - Move repeated page-level styling into portal-scoped components and CSS variables instead of ad hoc page-local classes.
  - Keep `components/ui/*` as generic primitives; do not fork the entire shadcn layer unless a primitive blocks required visuals.
  - Add a small set of reusable designed components where multiple Stitch pages share patterns: branded status badge, narrative section card, rail list item, action strip, entity result card, and import/review step indicator.

## Public Interfaces And Compatibility
- No route, API, or data-shape changes are planned.
- Preserve all existing page URLs, query params, fetch targets, mutation payloads, and response handling.
- Preserve current editor contracts:
  - `LoreEditor` still accepts `initialContent`, `onSave`, `className`, and `showSaveStatus`.
  - Existing template picker and promoted-field flows remain functionally equivalent.
- Preserve current connection workflows for AllCodex and AllKnower, including token login, password login, register/login mode switching, disconnect actions, and error surfaces.

## Test Plan
- Manual route verification for:
  - `/lore/new`
  - `/lore/[id]/edit`
  - `/statblocks`
  - `/quests`
  - `/settings`
  - `/import`
  - `/brain-dump`
  - `/brain-dump/[id]`
- Functional checks on each redesigned page:
  - Loading, empty, error, and populated states render correctly.
  - Existing mutations still fire with unchanged payloads and expected navigation.
  - Sidebar/top-nav active state matches the current route.
  - Mobile and desktop layouts both remain usable; sticky rails/action bars degrade cleanly on smaller screens.
- Editor-specific checks:
  - Existing HTML hydrates into the redesigned editor.
  - Typing, autosave, mentions, slash menu, image upload, and content PUT/POST flows still work.
  - New/edit page template selection and promoted-field persistence remain correct.
- Data workflow checks:
  - Statblock filtering/search/sorting still works.
  - Quest filtering still matches current status semantics.
  - Settings connect/disconnect flows still reflect status correctly.
  - Import preview/import/reset flows still work for both system-pack and Azgaar paths.
  - Brain dump auto/review/inbox flows still preserve current behavior and history access.

## Assumptions
- Scope is a full redesign pass, not a phased rollout.
- Stitch references are the visual source of truth, but implementation should adapt them into reusable React/Next components rather than mirror the static HTML literally.
- Current backend behavior, route structure, and feature semantics are correct and should not be redesigned as part of this pass.
- Because the portal currently has no test suite, acceptance will rely primarily on manual verification plus any existing type/build checks already available in the portal project.
