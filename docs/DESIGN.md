# Design System Strategy: The Tactile Mind

## 1. Overview & Creative North Star
The "Tactile Mind" is a design system that reimagines the digital language learning experience as a serene, physical ritual. Moving away from the frenetic gamification often seen in educational apps, this system is anchored by the **"Zen-Minimalist Library"** Creative North Star. 

We achieve a signature look by rejecting the standard "boxed" web layout. Instead, we use **intentional asymmetry** and **tonal depth** to simulate physical objects resting on a soft surface. The goal is to reduce cognitive load, allowing the user's memory to focus entirely on the language pairings. By utilizing extreme whitespace and a sophisticated, editorial type scale, we elevate "play" into a "premium practice."

---

## 2. Colors: The Atmospheric Palette
The palette is rooted in botanical greens and soft mists, designed to lower the heart rate.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be created through background shifts. For example, a card (using `surface_container_lowest`) should sit on a page section of `surface_container_low`. The eye should perceive a change in depth, not a hard line.

### Surface Hierarchy & Nesting
Treat the interface as a series of nested, organic layers:
- **Base Layer:** `surface` (#f8faf9) — Use for the primary canvas.
- **Sectioning:** `surface_container_low` (#f0f4f3) — Use for grouping content areas.
- **Interactive Elements:** `surface_container_lowest` (#ffffff) — Reserved for active cards or inputs to provide a "pop" of clarity.

### Glass & Gradient Rule
To prevent the UI from feeling "flat," use **Glassmorphism** for floating UI elements like navigation bars or score overlays. Use `surface` at 70% opacity with a `24px` backdrop-blur. 
For primary CTAs or the "matched" state of a card, apply a subtle linear gradient from `primary` (#3b6761) to `primary_container` (#bdece5) at a 135-degree angle to provide a "signature soul."

---

## 3. Typography: Editorial Clarity
We pair **Plus Jakarta Sans** (Display/Headline) with **Manrope** (Body) to balance modern playfulness with high-end readability.

- **Display (L/M/S):** Plus Jakarta Sans. Use `display-lg` (3.5rem) sparingly for "Success" states. The wide apertures of this font feel friendly and open.
- **Headlines:** Plus Jakarta Sans. Use `headline-sm` for card titles. It provides a distinct, "editorial" authority that standard sans-serifs lack.
- **Body & Labels:** Manrope. Selected for its rhythmic spacing. Use `body-lg` for the "Answer" side of cards to ensure maximum legibility during the memory game.
- **The Contrast Strategy:** Pair `headline-lg` in `on_surface` with a `label-md` in `on_surface_variant`. This high-contrast scale creates an intentional hierarchy that guides the eye without needing icons or bullets.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders are replaced with "Ambient Presence."

- **The Layering Principle:** Depth is achieved by stacking. A card in the Pelmanism game should be `surface_container_lowest`. When "flipped," it should transition to `primary_container` to indicate a state change through color, not just movement.
- **Ambient Shadows:** For "picked up" or "floating" cards, use a shadow: `0px 20px 40px rgba(45, 52, 51, 0.06)`. This uses the `on_surface` color at a very low opacity, mimicking natural light diffusion rather than digital "glow."
- **The Ghost Border Fallback:** If a component (like a secondary button) requires a boundary, use `outline_variant` (#acb3b2) at **15% opacity**. It should be felt, not seen.
- **Tactile Softness:** Utilize the Roundedness Scale aggressively. Memory cards must use `lg` (2rem), while the main game container uses `xl` (3rem) to create a "nested bowl" aesthetic.

---

## 5. Components: The Physicality of Learning

### Memory Cards (The Core Component)
- **Style:** No borders. Use `surface_container_lowest` for the face-down state.
- **Interaction:** On hover, the card should lift using the **Ambient Shadow** and scale by 2%. 
- **The "Match" State:** Transition to `secondary_container` with a subtle pulse animation. Avoid harsh "Correct" checkmarks; let the color transition do the work.

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`). `full` (9999px) roundedness. Typography: `title-sm` (Manrope).
- **Secondary:** Transparent background with a "Ghost Border" (15% `outline_variant`). 
- **Tertiary:** Text-only using `primary` color, with a slight background shift to `surface_container_high` on hover.

### Input Fields
- **Container:** `surface_container_low`. 
- **State:** When focused, the background shifts to `surface_container_lowest` and an `outline` of 10% opacity appears. No 100% opaque strokes.
- **Error State:** Use `error_container` as a soft background wash rather than a red border. Use `on_error_container` for the text label.

### Lists & Progress
- **Dividers:** **Forbidden.** Use `32px` of vertical whitespace (from the spacing scale) or a very subtle shift from `surface` to `surface_container_low` to denote a new list item.
- **Progress Bar:** Use `secondary_fixed_dim` for the track and `primary` for the fill. The bar should have `full` rounded corners and a height of `8px`.

---

## 6. Do’s and Don’ts

### Do
- **Do** use asymmetrical padding in your layouts (e.g., more top padding than bottom) to create an "editorial" feel.
- **Do** allow elements to overlap slightly (e.g., a "Current Score" chip overlapping the edge of the game board).
- **Do** use `on_surface_variant` for helper text to keep the interface feeling "quiet."

### Don’t
- **Don’t** use a 1px border for any reason. If you need separation, use color or space.
- **Don’t** use pure black (#000000) for text. Always use `on_surface` (#2d3433) to maintain the soft, organic tone.
- **Don’t** crowd the cards. If the screen feels full, increase the whitespace. The "Tactile Mind" requires room to breathe.
- **Don’t** use "bouncy" or "linear" animations. Use custom cubic-beziers (e.g., `0.34, 1.56, 0.64, 1`) to give elements a "weighted," physical feel when they move.