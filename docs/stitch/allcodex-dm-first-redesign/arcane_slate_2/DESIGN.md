```markdown
# Design System Document: The Living Grimoire

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Alchemist."** 

This interface is not a tool; it is an artifact. It represents the intersection of ancient ritual and hyper-advanced computation—a "Living Grimoire." We move away from the soft, rounded "friendly" UI of the last decade toward a world of absolute precision, high-contrast illumination, and monolithic geometry. By utilizing sharp 0px corners and a void-black foundation, we create a space that feels both infinitely deep and technologically sharp. The layout should favor intentional asymmetry, allowing elements to breathe like a hand-typeset manuscript while maintaining the rigid logic of a terminal interface.

## 2. Colors & Atmospheric Depth
The palette is rooted in the "Void" (`surface`), punctuated by high-energy bioluminescence.

### Surface Hierarchy & Nesting
To achieve depth without using traditional borders or shadows, we utilize tonal layering:
*   **The Foundation:** Use `surface` (#131313) for the primary canvas.
*   **The Inset:** Use `surface_container_lowest` (#0e0e0e) for recessed areas like code blocks or secondary sidebars to create a "carved" effect.
*   **The Lift:** Use `surface_container_high` (#2a2a2a) to bring interactive cards forward.
*   **The Glow:** Use `secondary_container` (#573976) as a subtle, large-scale background wash behind key content areas to simulate a violet aura.

### The Rules of Engagement
*   **The "No-Line" Rule:** Explicitly prohibit 1px solid grey borders for sectioning. Boundaries must be defined by background shifts or the **"Violet Glow Border"**—a thin, high-contrast line using `secondary` (#dcb8ff) or `outline_variant` at low opacity, specifically intended to look like a laser-etched edge.
*   **The Glass & Gradient Rule:** For floating modals or "spectral" overlays, use a backdrop-blur (minimum 20px) combined with `surface_variant` at 40% opacity. This prevents the UI from feeling flat and adds a sense of "digital mist."
*   **Signature Textures:** Use a subtle linear gradient on primary CTAs, transitioning from `primary` (#f6bb7a) to `primary_container` (#734912) at a 135-degree angle. This provides a metallic, "forged" feel.

## 3. Typography: The Editorial Script
Typography is the primary driver of the system’s "Grimoire" aesthetic. We pair the authoritative weight of stone-carved serifs with the efficiency of modern sans-serifs.

*   **Display & Headlines (Cinzel):** Used for H1 through H3. Cinzel brings a classical, Roman stateliness. Headlines should always be set with generous tracking (letter-spacing: 0.05em) and should prioritize short, impactful phrases.
*   **Body Content (Newsreader):** Used for long-form reading and titles. This serif font provides an intellectual, literary quality that contrasts the dark interface. It should feel like reading a high-end editorial piece.
*   **UI Labels & Metadata (Inter UI):** All functional elements—buttons, labels, input hints, and technical data—must use Inter. This ensures the "AI Interface" side of the aesthetic is legible, precise, and utilitarian.

## 4. Elevation & Tonal Layering
In this design system, "up" does not mean "closer to the sun." It means "more illuminated."

*   **The Layering Principle:** Stack `surface-container` tiers to define hierarchy. An inner container should always be `surface_container_highest` if it sits on a `surface_container_low` base. 
*   **Ambient Glows:** Replace traditional drop shadows with ambient glows. When an element is "active" or floating, apply a drop shadow using the `secondary` color (#dcb8ff) at 10% opacity with a 30px-60px blur. This creates a "spectral" lift rather than a physical one.
*   **The Ghost Border:** For accessibility in forms, use a 1px border of `outline_variant` (#4c4354) at 20% opacity. It should be barely perceptible, providing just enough structure to guide the eye without breaking the monolithic aesthetic.

## 5. Components

### Buttons
*   **Primary:** Sharp 0px corners. Background: `primary` (#f6bb7a). Text: `on_primary` (#482900). On hover, add a 4px outer glow of `primary` at 30% opacity.
*   **Secondary:** Sharp 0px corners. Border: 1px `secondary` (#dcb8ff). Background: Transparent. Text: `secondary`.
*   **Tertiary:** No border. Text: `tertiary` (#29dfb5). For use in low-priority utility actions.

### Data Chips & Details
*   **Spectral Details:** Use `tertiary` (#29dfb5) for small UI details like icons, active status dots, or micro-charts. This "Spectral Teal" represents the "data soul" of the grimoire.
*   **Warning States:** Use `error` (#ffb4ab) and `on_error_container` (#ffdad6) for destructive actions. Apply a subtle flicker animation or a "Hot Rose" glow to emphasize volatility.

### Cards & Lists
*   **The Rule of Space:** Forbid the use of horizontal dividers. Use `spacing.8` (2rem) of vertical white space or a shift to `surface_container_lowest` to separate list items. 
*   **Monolithic Cards:** Cards must have 0px radius. Use a top-border-only "Violet Glow" (1px `secondary`) to give the card a sense of orientation and energy.

### Input Fields
*   **Input Style:** Never use four-sided boxes. Use a bottom-only border (2px) of `outline_variant`. Upon focus, animate the border to `primary` and add a faint `primary_container` background wash.

## 6. Do’s and Don'ts

### Do:
*   **Do** use extreme typographic scale (e.g., a very large `display-lg` headline next to a small `label-md` metadata tag).
*   **Do** use `tertiary` (Teal) for any element that suggests AI processing, data streams, or technical precision.
*   **Do** embrace asymmetry. Align content to the left but allow imagery or decorative "runes" to bleed off the right edge of the grid.

### Don't:
*   **Don't** use border-radius. Every corner in the system must be a sharp 90-degree angle.
*   **Don't** use pure white (#FFFFFF). Use `on_surface` (#e5e2e1) to maintain the "aged" feel of the interface.
*   **Don't** use standard "Material Design" shadows. If an element needs to stand out, use color-tinted light (Glows), not black shadows.
*   **Don't** clutter the screen. If a section feels crowded, increase the spacing tokens rather than adding dividers.

---
**Director's Note:** Treat every screen like a page from a sacred text. Every pixel should feel like it was placed with ritualistic intent. If it looks like a standard dashboard, you haven't pushed the contrast far enough.```