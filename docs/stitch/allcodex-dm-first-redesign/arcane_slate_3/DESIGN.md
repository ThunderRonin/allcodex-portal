# Design System Strategy: The Alchemist’s Terminal

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Grimoire."** This is not a standard SaaS interface; it is a high-fantasy, precision instrument—a terminal where ancient lore meets futuristic computation. 

To break the "template" look, we lean into **Ritualistic Geometry**. The layout should feel like a ritual circle: perfectly sharp, intentionally asymmetrical, and deeply layered. We replace the friendly "roundness" of modern web design with brutalist 0px corners and high-contrast light sources. Surfaces do not just "sit" on the screen; they emerge from the void. Use overlapping containers and offset typography to create an editorial feel that suggests a living document rather than a static webpage.

---

## 2. Colors & Atmospheric Depth
The palette is rooted in a "Void-Black" foundation, designed to make the neon amber and spectral teal "pop" as if they are emitting actual light.

*   **The "No-Line" Rule:** Traditional 1px solid grey borders are strictly forbidden. Sectional boundaries must be defined by shifts in background depth (e.g., placing a `surface-container-highest` panel against the `surface-dim` background). 
*   **Surface Hierarchy:** Depth is an alchemical process. Use the `surface-container` tiers to create "Nesting." 
    *   **Level 0 (Background):** `surface-dim` (#14121c) for the absolute base.
    *   **Level 1 (Sections):** `surface-container-low` (#1c1a25) for large content areas.
    *   **Level 2 (Active Elements):** `surface-container-highest` (#36333f) for cards or interactive modules.
*   **The "Violet Glow" (Aura):** Instead of borders, use the `secondary` (#dcb8ff) and `secondary-container` (#7701d0) tokens to create "Auras." Apply these as subtle inner glows or outer neon blooms to highlight active selection.
*   **Signature Textures:** For primary CTAs, do not use flat hex codes. Apply a linear gradient from `primary` (#ffc381) to `primary-container` (#f5a032) at a 135-degree angle to simulate the flicker of magical amber.

---

## 3. Typography: The Calligraphy of Logic
Typography is the primary vehicle for the "Alchemist" aesthetic. We pair the stone-carved weight of 'Cinzel' with the razor-sharp legibility of 'Inter' and the academic grace of 'Newsreader.'

*   **Display & Headline (Cinzel):** Used for titles that require "weight." These should feel like they were chiseled into the interface. Use `headline-lg` and `display-md` for major section headers.
*   **Body & UI (Inter / Newsreader):** 
    *   Use **Newsreader** for long-form lore or descriptive text (`body-lg`) to maintain a "manuscript" feel.
    *   Use **Inter** for functional UI labels, terminal inputs, and data points (`label-md`) to ensure the "Terminal" aspect feels precise and high-tech.
*   **Intentional Scale:** Drive drama by using extreme contrast. Pair a `display-lg` header in Neon Amber with a tiny, all-caps `label-sm` subtitle in Spectral Teal to create an authoritative, editorial hierarchy.

---

## 4. Elevation & Depth: Tonal Layering
In the void, there is no sun—only the glow of the interface. Hierarchy is achieved through light emission rather than shadows.

*   **The Layering Principle:** Stack surfaces to create focus. An "Inventory" panel should be `surface-container-lowest`, while an "Item Detail" card popping over it should be `surface-container-highest`. This creates a natural "lift."
*   **Ambient Shadows:** Traditional drop shadows are replaced with "Light Leaks." Use a large blur (24px+) with the `on-secondary` (#480082) color at 10% opacity to create a purple atmospheric haze around floating modals.
*   **The "Ghost Border" Fallback:** If containment is required for accessibility, use the `outline-variant` token at 15% opacity. It should feel like a faint chalk line, not a box.
*   **Glassmorphism:** For overlays, use `surface-container-high` with a 12px `backdrop-blur`. This allows the "Void" background to bleed through, maintaining the dark atmosphere while indicating a temporary state.

---

## 5. Components: Functional Relics

### Buttons (Transmutation Triggers)
*   **Primary:** Sharp 0px corners. Background: `primary` to `primary-container` gradient. Text: `on-primary` (Cinzel, Bold). 
*   **Secondary:** Ghost style. No background. Border: 1px "Ghost Border" using `secondary`. Text: `secondary`.
*   **States:** On hover, the primary button should gain a `secondary-container` (Violet) outer glow.

### Input Fields (The Terminal)
*   **Style:** Minimalist. Only a bottom border (1px) using `outline`. 
*   **Active State:** The bottom border transforms into a `tertiary` (Spectral Teal) line with a 2px "glow" blur. Text remains `on-surface`.
*   **Error:** Use `error` (Hot Rose) for the underline and helper text.

### Cards & Lists (The Ledger)
*   **Rule:** Forbid divider lines. Use `spacing-4` (1.4rem) of vertical whitespace or a slight shift to `surface-container-low` to separate items.
*   **Selection:** An active list item should have a 4px vertical "strike" of `primary` (Amber) on the far left edge.

### Additional Component: The "Sigil" Loader
*   A custom progress indicator using a rotating geometric shape (square or diamond) in `tertiary` (Teal), with a trailing "spectral" blur.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use 0px border-radius everywhere. Sharpness is a sign of precision.
*   **DO** use `tertiary` (Spectral Teal) for AI-driven insights or success states to differentiate "Magic" from "Action."
*   **DO** leave ample breathing room. The "Void" (background) is as important as the content. Use `spacing-10` or `spacing-12` between major modules.

### Don’t:
*   **DON'T** use rounded corners. Even a 2px radius breaks the "Alchemist Terminal" immersion.
*   **DON'T** use pure white (#FFFFFF). Always use `on-surface` (#e6e0ef) to maintain the atmospheric, low-light environment.
*   **DON'T** use 1px grey lines. They are the hallmark of generic design. If you need a divider, use a `surface-variant` color shift or a change in typography scale.