# Design System Strategy: The Digital Grimoire

## 1. Overview & Creative North Star
**Creative North Star: "The Relic of the Future"**
This design system rejects the soft, rounded "friendliness" of modern SaaS. Instead, it embraces the precision of an ancient artifact fused with high-tech luminosity. We are building a "Digital Grimoire"—an interface that feels like it was etched into obsidian and powered by neon sorcery. 

To break the "template" look, we utilize **0px radius corners** to evoke a sense of sharp, uncompromising authority. Layouts should favor intentional asymmetry, using large `display-lg` typography to anchor the eye while allowing UI elements to float as layered "shards" of data. We move away from the grid-locked container and toward an editorial experience where depth is felt through light and shadow, not lines.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Void-Black" foundation, allowing our high-chroma accents to act as light sources within the interface.

*   **Primary (Neon Amber):** Used for critical actions and knowledge-based interactions. It is the "ink" of the grimoire.
*   **Secondary (Spectral Teal):** Reserved exclusively for AI-driven insights and ethereal states.
*   **Tertiary (Electric Violet):** Used for "Glow Borders" and energy-state indicators.
*   **Error (Hot Rose):** A sharp, high-visibility warning color.

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts. For example, a sidebar should be `surface-container-low` (#1c1a25) sitting against a `surface` (#14121c) main area. If a visual break is needed, use vertical whitespace (12 or 16 from the Spacing Scale).

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked obsidian sheets. Use the `surface-container` tiers to create "nested" depth:
1.  **Base Layer:** `surface` (#14121c)
2.  **Sectional Containers:** `surface-container-low` (#1c1a25)
3.  **Interactive Cards:** `surface-container-highest` (#36333f)

### The Glass & Gradient Rule
To achieve "Digital Alchemy," use Glassmorphism for floating overlays. Apply a 20% opacity to your `surface-container` color and pair it with a `backdrop-blur` (min 12px). For primary CTAs, do not use flat hex codes; use a linear gradient from `primary` (#ffc381) to `primary-container` (#f5a032) at a 135-degree angle to provide "soul" and dimension.

---

## 3. Typography
The typographic system is a tri-font hierarchy designed for editorial weight.

*   **Display & Headlines (Cinzel):** Used for structural titles. This serif face carries the "ancient" weight. It should be tracked tightly (-0.02em) to maintain a modern, aggressive feel.
*   **Lore & Excerpts (Newsreader):** Used for storytelling, long-form reading, or "AI-generated lore." This creates a tactile, academic contrast against the sharp UI.
*   **UI & Body (Inter):** The workhorse for utility. Use Inter for labels, inputs, and dense data to ensure maximum legibility against the dark background.

**Hierarchy Note:** Use dramatic scale shifts. A `display-lg` headline should tower over `body-md` text to create a sense of importance and "Artifact" scale.

---

## 4. Elevation & Depth
In this system, depth is a byproduct of light emission, not physical shadows.

*   **The Layering Principle:** Stacking higher-tier containers (e.g., `surface-container-high` on `surface-dim`) creates a natural lift.
*   **Ambient Glows:** Instead of standard grey shadows, use "Glow Shadows." When a card is active, apply a diffused shadow (blur: 24px) using the `tertiary` (#d4c6ff) color at 8% opacity. This mimics the glow of a magical screen.
*   **The Ghost Border:** If accessibility requires a stroke, use the `outline-variant` token at 15% opacity. Never use 100% opaque borders.
*   **0px Precision:** All containers, buttons, and inputs must have **0px roundedness**. Sharp corners are non-negotiable; they reinforce the "Slate" aesthetic.

---

## 5. Components

### Buttons
*   **Primary:** Linear gradient (`primary` to `primary-container`), 0px radius, uppercase `label-md` Inter text with 0.1em tracking.
*   **Secondary (Ghost):** No fill. 1px Ghost Border (15% opacity `outline`). On hover, the border glows `tertiary` violet.
*   **Tertiary:** Text-only, `primary` color, with a subtle 2px underline that expands on hover.

### Input Fields
*   **Base State:** `surface-container-highest` background, 0px radius, `outline-variant` bottom-border only.
*   **Focus State:** The bottom border transforms into a `secondary` (Spectral Teal) glow with a 4px `backdrop-blur` behind the input text.

### Cards & Lists
*   **Rule:** No dividers. Use `surface-container` shifts to separate list items. 
*   **Structure:** A card should use `surface-container-low`. Upon hover, it transitions to `surface-container-high` and gains a 1px Electric Violet "Glow Border" on the left edge only.

### AI Lore Chips
*   **Style:** `secondary-container` background with 10% opacity, `secondary` text. Used for tagging AI-generated content or magical properties.

---

## 6. Do's and Don'ts

### Do:
*   Use **intentional asymmetry.** Align a headline to the far left and the body text to a narrow column on the right.
*   Use **Backdrop Blurs.** Any element that sits "above" the main surface must blur the content beneath it.
*   Use **Spectral Teal** exclusively for AI or "magical" feedback.

### Don't:
*   **Never use border-radius.** Even a 2px radius breaks the Grimoire's "sharp obsidian" feel.
*   **Avoid pure white text.** Always use `on-surface` (#e6e0ef) or `on-surface-variant` (#d8c3af) to prevent eye strain against the void-black background.
*   **No "Flat" Buttons.** Buttons should feel like they are emitting light or are etched deep into the surface.
*   **No Standard Dividers.** If you feel the need to add a line, add 24px of empty space instead.