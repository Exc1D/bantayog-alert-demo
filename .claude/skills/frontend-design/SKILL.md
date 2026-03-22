---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
allowed-tools: Read, Write, Edit, Bash
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## When to Use

- When building new UI components, pages, or application interfaces
- When redesigning existing components with higher design quality
- When the user asks to create or improve frontend code
- For scroll-driven animated websites or distinctive visual interfaces

## When NOT to Use

- For purely logic-focused changes with no visual component
- When the existing design already meets the brief and only logic needs updating
- For backend-only work (APIs, databases, auth logic)

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial), cliched color schemes (purple gradients on white backgrounds), predictable layouts, and cookie-cutter design.

## Scroll-Driven Website Design Guidelines

When invoked for a scroll-driven animated website:

### Typography as Design
- Hero headings: **6rem minimum**, tight line-height (0.9-1.0), heavy weight (700-800)
- Section headings: **3rem minimum**, confident weight (600-700)
- Horizontal marquee text: **10-15vw**, uppercase, letterspaced
- Section labels: small (0.7rem), uppercase, letterspaced

### No Cards, No Boxes
- **NEVER** use glassmorphism cards, frosted glass, or visible containers around text on scroll-driven sites
- Text sits directly on the background — clean, confident, editorial
- The only acceptable "container" is generous padding on the section itself

### Color Zones
- Background color must shift between sections (light → dark → accent → light)
- Define color zones in CSS variables: `--bg-light`, `--bg-dark`, `--bg-accent`

### Animation Choreography
- Every section must use a DIFFERENT entrance animation (fade-up, slide-left, scale-up, clip-path reveal)
- Elements within a section enter with staggered delays (0.08-0.12s between items)
- Sequence: label first → heading → body text → CTA/button

### Stats & Numbers
- Display stats at **4rem+** font size
- Numbers MUST count up via GSAP (never appear statically)
- Use a suffix element for units at a smaller size
