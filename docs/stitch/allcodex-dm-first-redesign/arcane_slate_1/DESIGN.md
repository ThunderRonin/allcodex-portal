# Design System Strategy: The Arcane Interface

## 1. Overview & Creative North Star
**Creative North Star: The Living Grimoire**
This design system rejects the "flatness" of modern SaaS in favor of a digital experience that feels etched into obsidian and powered by neon sorcery. We are building a "Living Grimoire"—an interface that feels like a high-end editorial wiki, blending the scholarly density of *Wikipedia* with the visceral, high-fidelity immersion of *Baldur’s Gate 3*.

To break the "template" look, we utilize **intentional asymmetry**. Layouts should feel like a curated manuscript: large display type may bleed off-center, and sidebar elements should sit at varying depths using tonal layering rather than rigid, bordered boxes. We emphasize **sharp lines** and **vibrant contrast** to ensure that despite the dark "Void" backdrop, the information density remains hyper-readable and "electric."

---

## 2. Colors & Surface Logic
The palette is rooted in the `background` (#0a0812), but the soul of the system lies in how we layer these voids.

*   **Primary (`#ffc381` / `primary_container` #f5a032):** Our "Neon Amber." Reserved for interactive states, primary headings, and calls to action. It represents "The Flame of Knowledge."
*   **Secondary (`#dcb8ff` / `secondary_container` #7701d0):** "Electric Violet." Used for borders that glow and high-level navigation accents.
*   **Tertiary (`#37e7bc` / `tertiary_container` #00caa2):** "Spectral Teal." Exclusively for AI-generated content, metadata tags, and magical attributes.
*   **Error (`#f04060` / `on_error` #690005):** "Hot Rose." Use sparingly for warnings and volatile lore entries.

### The "No-Line" Rule
Prohibit 1px solid borders for sectioning content. Boundaries are defined by background shifts. To separate a sidebar from the main article, use `surface_container_low` (#1c1a25) against the `background` (#14121c). The eye should perceive depth through value changes, not "boxes."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked obsidian slabs:
1.  **Base Layer:** `surface` (#14121c) - The infinite void.
2.  **Navigation/Sidebars:** `surface_container_lowest` (#0f0d17) - Deeper, more recessed areas.
3.  **Article Cards/Modals:** `surface_container_high` (#2b2834) - Elements that "rise" toward the reader.

### The Glass & Gradient Rule
For high-priority floating elements (like a "Quick Search" or "Spell Filter"), use **Glassmorphism**. Apply `surface_variant` at 60% opacity with a `backdrop-filter: blur(12px)`. To provide "soul," apply a subtle linear gradient to main CTAs transitioning from `primary` (#ffc381) to `primary_container` (#f5a032) at a 45-degree angle.

---

## 3. Typography
We use a high-contrast serif-on-serif pairing to maintain an editorial, "scholarly" feel.

*   **Display & Headlines (Cinzel):** Used for all `display-lg` through `headline-sm`. Cinzel's stone-carved proportions provide authority. Use `primary` colors for these to make titles feel "ignited."
*   **Body & Titles (Crimson Text / Newsreader):** Used for all `title-lg` down to `body-sm`. These fonts provide the "Wikipedia" readability. Keep body copy in `on_surface` (#e6e0ef) for high legibility against the dark void.
*   **Labels (Inter):** For technical data, UI buttons, and small metadata (`label-md`). This provides a modern, functional counterpoint to the fantasy serifs.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Instead of a shadow, place a `surface_container_highest` card on top of a `surface_container_low` section. The change in "darkness" defines the lift.

### Ambient Shadows
When an element must float (e.g., a hover-state tooltip), use an **Ambient Shadow**:
*   `box-shadow: 0 20px 40px rgba(138, 43, 226, 0.15);` (A faint violet glow rather than black/grey).

### The "Ghost Border" Fallback
If an element requires a container (like an input field), use a **Ghost Border**: `outline_variant` at 15% opacity. For interactive elements, this border should transition to a 1px `secondary` glow on focus.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary_container` (#f5a032) with `on_primary` (#482900) text. Sharp 0px corners.
*   **Secondary (The "Glow" Variant):** Ghost border of `secondary` (#dcb8ff) with a `0 0 8px` outer glow.
*   **Tertiary:** Text-only in `primary`, underlined only on hover.

### Cards & Wiki Entries
**Forbid divider lines.** Use `1.5rem` (Space 6) of vertical whitespace to separate headers from paragraphs. Use a vertical "accent bar" of 2px `secondary` on the left side of blockquotes instead of a full box.

### Arcane Tags (Chips)
Small, sharp-edged rectangles using `tertiary_container` (#00caa2) at 10% opacity with `tertiary` text. These should look like glowing "runes."

### Input Fields
Background must be `surface_container_lowest`. No top or side borders; use a single 1px bottom border in `outline_variant`. On focus, the bottom border "ignites" into `primary`.

### New Component: The Lore-Header
A full-width display section where the `display-lg` text has a subtle `text-shadow: 0 0 12px rgba(245, 160, 50, 0.4)`. This creates the "Electric" look requested.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme whitespace to let the typography breathe; treat every wiki page like a luxury magazine layout.
*   **Do** use `tertiary` (Teal) for anything AI-related or system-automated to distinguish it from "human-written" lore.
*   **Do** use sharp 0px corners exclusively. This system is about "blades and runes," not "bubbles and clouds."

### Don’t:
*   **Don’t** use pure white (#FFFFFF). It will shatter the dark fantasy immersion. Use `on_surface` (#e6e0ef) for text.
*   **Don’t** use standard 1px borders to separate content. It makes the site look like a legacy table-based layout.
*   **Don’t** use "Drop Shadows." Use "Glows" (colored blurs) or tonal shifts.