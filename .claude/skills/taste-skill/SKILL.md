---
name: design-taste-frontend
description: Senior UI/UX Engineer. Architect digital interfaces overriding default LLM biases. Enforces metric-based rules, strict component architecture, CSS hardware acceleration, and balanced design engineering.
allowed-tools: Read, Write, Edit
---

# High-Agency Frontend Skill

## When to Use

- When creating or significantly redesigning frontend UI components
- As a design quality gate before committing new interfaces
- When default "AI slop" aesthetics need to be deliberately avoided
- For projects where design differentiation is a stated goal

## When NOT to Use

- For backend-only tasks with no frontend component
- When the user explicitly wants minimal/utility-focused UI
- For data-processing, API, or infrastructure-only changes
- Without checking package.json dependencies first

## 1. ACTIVE BASELINE CONFIGURATION
* DESIGN_VARIANCE: 8 (1=Perfect Symmetry, 10=Artsy Chaos)
* MOTION_INTENSITY: 6 (1=Static/No movement, 10=Cinematic/Magic Physics)
* VISUAL_DENSITY: 4 (1=Art Gallery/Airy, 10=Pilot Cockpit/Packed Data)

**AI Instruction:** The standard baseline for all generations is strictly set to these values (8, 6, 4). Do not ask the user to edit this file. Otherwise, ALWAYS listen to the user: adapt these values dynamically based on what they explicitly request in their chat prompts.

## 2. DEFAULT ARCHITECTURE & CONVENTIONS

* **DEPENDENCY VERIFICATION [MANDATORY]:** Before importing ANY 3rd party library (e.g. `framer-motion`, `lucide-react`, `zustand`), you MUST check `package.json`. If the package is missing, you MUST output the installation command before providing the code.
* **Framework & Interactivity:** React or Next.js. Default to Server Components (`RSC`).
    * **RSC SAFETY:** Global state works ONLY in Client Components.
    * **INTERACTIVITY ISOLATION:** If Sections 4 or 7 (Motion/Liquid Glass) are active, the specific interactive UI component MUST be extracted as an isolated leaf component with `'use client'`.
* **State Management:** Use local `useState`/`useReducer` for isolated UI. Use global state strictly for deep prop-drilling avoidance.
* **Styling Policy:** Use Tailwind CSS (v3/v4) for 90% of styling.
* **ANTI-EMOJI POLICY [CRITICAL]:** NEVER use emojis in code, markup, text content, or alt text. Replace symbols with high-quality icons (Radix, Phosphor) or clean SVG primitives.
* **Viewport Stability [CRITICAL]:** NEVER use `h-screen` for full-height Hero sections. ALWAYS use `min-h-[100dvh]`.

## 3. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

**Rule 1: Deterministic Typography**
* Display/Headlines: Default to `text-4xl md:text-6xl tracking-tighter leading-none`
* **ANTI-SLOP:** Discourage `Inter` for "Premium" or "Creative" vibes. Force unique character using `Geist`, `Outfit`, `Cabinet Grotesk`, or `Satoshi`
* **TECHNICAL UI RULE:** Serif fonts are strictly BANNED for Dashboard/Software UIs

**Rule 2: Color Calibration**
* **Constraint:** Max 1 Accent Color. Saturation < 80%
* **THE LILA BAN:** The "AI Purple/Blue" aesthetic is strictly BANNED. No purple button glows, no neon gradients

**Rule 3: Layout Diversification**
* **ANTI-CENTER BIAS:** Centered Hero/H1 sections are strictly BANNED when `LAYOUT_VARIANCE > 4`

**Rule 4: Materiality, Shadows, and "Anti-Card Overuse"**
* For `VISUAL_DENSITY > 7`, generic card containers are strictly BANNED

**Rule 5: Interactive UI States**
* **Mandatory Generation:** Implement full interaction cycles: Loading (skeletal loaders), Empty States, Error States, Tactile Feedback

**Rule 6: Data & Form Patterns**
* Forms: Label MUST sit above input. Helper text is optional. Error text below input.

## 4. CREATIVE PROACTIVITY (Anti-Slop Implementation)

* **"Liquid Glass" Refraction:** When glassmorphism is needed, go beyond `backdrop-blur`
* **Magnetic Micro-physics (If MOTION_INTENSITY > 5):** Implement buttons that pull slightly toward the mouse cursor using Framer Motion's `useMotionValue` and `useTransform`
* **Perpetual Micro-Interactions:** When `MOTION_INTENSITY > 5`, embed continuous infinite micro-animations
* **Staggered Orchestration:** Do not mount lists or grids instantly

## 5. PERFORMANCE GUARDRAILS

* **DOM Cost:** Apply grain/noise filters exclusively to fixed, pointer-event-none pseudo-elements
* **Hardware Acceleration:** Never animate `top`, `left`, `width`, or `height`. Animate exclusively via `transform` and `opacity`
* **Z-Index Restraint:** NEVER spam arbitrary `z-50` or `z-10` unprompted

## 6. TECHNICAL REFERENCE (Dial Definitions)

### DESIGN_VARIANCE (Level 1-10)
* **1-3 (Predictable):** Flexbox `justify-center`, strict 12-column symmetrical grids
* **4-7 (Offset):** Use `margin-top: -2rem` overlapping, varied image aspect ratios
* **8-10 (Asymmetric):** Masonry layouts, CSS Grid with fractional units

### MOTION_INTENSITY (Level 1-10)
* **1-3 (Static):** No automatic animations. CSS `:hover` and `:active` states only
* **4-7 (Fluid CSS):** Use `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`
* **8-10 (Advanced Choreography):** Complex scroll-triggered reveals or parallax

### VISUAL_DENSITY (Level 1-10)
* **1-3 (Art Gallery Mode):** Lots of white space. Huge section gaps
* **4-7 (Daily App Mode):** Normal spacing for standard web apps
* **8-10 (Cockpit Mode):** Tiny paddings. No card boxes; just 1px lines to separate data

## 7. AI TELLS (Forbidden Patterns)

### Visual & CSS
* **NO Neon/Outer Glows** * **NO Pure Black** (use Off-Black, Zinc-950) * **NO Oversaturated Accents**

### Typography
* **NO Inter Font:** Banned. Use `Geist`, `Outfit`, `Cabinet Grotesk`, or `Satoshi`
* **NO Oversized H1s**

### Content & Data
* **NO Generic Names:** "John Doe", "Sarah Chan" are banned
* **NO Generic Avatars:** DO NOT use standard SVG "egg" or Lucide user icons
* **NO Fake Numbers:** Avoid predictable outputs like `99.99%`, `50%`

## 8. THE CREATIVE ARSENAL

Pull from this library of advanced concepts: Bento Grid, Masonry Layout, Parallax Tilt Card, Glassmorphism Panel, Sticky Scroll Stack, Horizontal Scroll Hijack, Kinetic Marquee, Text Scramble Effect, Particle Explosion Button, Directional Hover Aware Button.

## 9. THE "MOTION-ENGINE" BENTO PARADIGM

When generating modern SaaS dashboards or feature sections, utilize the "Bento 2.0" architecture and motion philosophy:
- **Aesthetic:** High-end, minimal, and functional
- **Palette:** Background in `#f9fafb`. Cards are pure white with 1px border
- **Surfaces:** Use `rounded-[2.5rem]` for all major containers
- **Animation Engine:** All cards must contain "Perpetual Micro-Interactions" with Spring Physics

## 10. FINAL PRE-FLIGHT CHECK

- [ ] Is global state used appropriately to avoid deep prop-drilling?
- [ ] Is mobile layout collapse guaranteed for high-variance designs?
- [ ] Do full-height sections safely use `min-h-[100dvh]` instead of `h-screen`?
- [ ] Do `useEffect` animations contain strict cleanup functions?
- [ ] Are empty, loading, and error states provided?
- [ ] Did you strictly isolate CPU-heavy perpetual animations in their own Client Components?
