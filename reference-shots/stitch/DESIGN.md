# Design System Strategy: Technical Vector Interface

## 1. Overview & Creative North Star
### The Creative North Star: "Tactical Schematics"
This design system is not a standard web interface; it is a high-performance terminal for industrial engineering. We are moving away from "consumer-grade" UI and toward "military-grade" precision. The aesthetic bridge is found where **Blueprint meets Vector Export Tool**. 

The goal is to evoke the feeling of a heads-up display (HUD) or a CAD workstation. This is achieved through a rigid, high-contrast grid system, zero-radius corners, and a hierarchy that prioritizes data density over decorative white space. We break the "template" look by using intentional asymmetry—placing labels on non-standard axes and using overlapping technical callouts that "break" the container boundaries, mimicking a live technical drawing.

---

## 2. Colors
The palette is built on high-utility contrast, utilizing a "Hadal" deep green foundation punctuated by high-vis "Toxic" and "Amber" alerts.

- **Primary (`#ebffe2`, `#00ff41`):** Use for active states and high-priority technical readouts. This is your "active laser" color.
- **Secondary (`#a6d1b1`, `#2b5139`):** Represents the structural foundation. The deep HADAL green should be used for massive surface areas to provide depth.
- **Tertiary (`#f59e0b` / `amber`):** Reserved strictly for warnings, telemetry errors, or critical "action required" highlights.
- **Neutral/Surface (`#121412`):** A true deep-space background that allows the greens to "glow" without bleeding.

### The "No-Line" Rule
Prohibit 1px solid borders for sectioning. Structural boundaries must be defined solely through background shifts. For example, a `surface-container-low` panel should sit directly on a `surface` background. The eye should perceive the edge via the change in value, not a drawn line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#121412)
- **Primary Panel:** `surface-container-low` (#1a1c1a)
- **Nested Controls:** `surface-container-high` (#292a28)
This creates a "milled" look, as if the interface has been etched into a physical console.

### Signature Textures
Use subtle linear gradients for CTAs, transitioning from `primary` to `primary-container`. This adds a "backlit" effect common in aerospace instrumentation.

---

## 3. Typography
Typography is the primary driver of the "Technical Blueprint" aesthetic.

- **Display & Headlines (Space Grotesk):** Chosen for its wide stance and geometric rigor. Use `display-lg` for mech model designations.
- **Body & Functional (Inter):** Highly legible at small scales. Use `body-sm` for long-form technical descriptions.
- **Labels (Space Grotesk Mono-weight):** All technical data—coordinates, vector scales, and part numbers—must use `label-md` or `label-sm`. 
- **The Identity Hierarchy:** Headlines should feel "stamped" onto the surface (High contrast, bold), while labels should feel like "etched" metadata (lower opacity or `on-surface-variant`).

---

## 4. Elevation & Depth
In this system, depth is a function of light, not physics. 

- **The Layering Principle:** Stack `surface-container` tiers to create hierarchy. A floating diagnostic window should use `surface-bright` to appear closer to the user.
- **Ambient Shadows:** Standard drop shadows are forbidden. If a float is necessary, use a "Toxic Glow" shadow—a highly diffused (40px+) shadow using the `primary` color at 4-6% opacity. It should feel like the component is emitting light onto the surface below.
- **The "Ghost Border" Fallback:** If a border is required for clarity in complex schematics, use `outline-variant` at 15% opacity. It must look like a "guide line" in a vector tool, not a container wall.
- **Glassmorphism:** Use `backdrop-blur` (12px-20px) on control overlays (like camera controls) to allow the mech wireframes to remain visible beneath the UI, maintaining the "Blueprint" immersion.

---

## 5. Components

### Buttons
- **Primary:** Zero-radius corners. Background: `primary_container`. Text: `on_primary`. 
- **Secondary:** Transparent background with a `Ghost Border`. Text: `primary`.
- **States:** On hover, the button should "overload"—shifting to a white background with a primary-colored "glow" shadow.

### Inputs & Sliders
- **Technical Sliders:** Use a `primary` color track with an `amber` thumb for critical adjustments. 
- **Text Inputs:** No fill. Use a bottom-only border (`outline-variant`) to mimic a fillable form in a technical manual.

### Chips (Data Tags)
- Used for "Part Status" or "Material Type." Square edges only. Use `secondary_container` for the background to keep them distinct but non-distracting.

### Technical Callouts (Custom Component)
- **The "Leader Line":** A thin, 45-degree angled line connecting a label to a specific vector point on the mech. Use `outline` color. This is the signature element of the "Blueprint" aesthetic.

---

## 6. Do's and Don'ts

### Do:
- **Use Monospacing for Numbers:** All telemetry and coordinates must use monospaced fonts to prevent layout jitter during live updates.
- **Embrace Asymmetry:** Place labels in the margins or rotated 90 degrees to mimic "blueprint annotations."
- **Apply "Toxic" Sparingly:** Use the `#00FF41` color only for active data or primary actions; it should be the "signal" in the "noise."

### Don't:
- **No Rounded Corners:** Any radius above `0px` is a violation of the system's industrial rigor.
- **No Drop Shadows:** Avoid standard black/grey shadows. Use tonal shifts or light glows.
- **No Dividers:** Never use a horizontal rule to separate list items. Use a 0.5rem vertical space or a subtle shift to `surface-container-low`.
- **No Soft Transitions:** Interactions should be "snappy" (0.1s duration) to mimic a high-speed digital processor.