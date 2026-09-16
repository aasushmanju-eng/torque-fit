# Design Brief

## Direction

Torque Fit — a dark, high-energy gym/fitness app with a near-black surface and electric neon blue accents, refined into a premium paid-app feel.

## Tone

Bold, technical, athletic — a "precision instrument" aesthetic: brutally minimal near-black surfaces with one disciplined neon blue accent used sparingly for energy and focus.

## Differentiation

Neon blue as a single disciplined accent on near-black surfaces, with Space Grotesk display type, mono numeric stats, and a choreographed motion system — reads like a premium performance dashboard, not a generic fitness app.

## Color Palette

| Token      | OKLCH         | Role                              |
| ---------- | ------------- | --------------------------------- |
| background | 0.12 0.012 250| near-black app canvas             |
| foreground | 0.93 0.01 250 | primary text                      |
| card       | 0.16 0.014 250| elevated surface panels           |
| popover    | 0.185 0.016 250| floating menus / dialogs         |
| primary    | 0.66 0.2 240  | neon blue accent / CTAs           |
| accent     | 0.66 0.2 240  | highlights, active states         |
| muted      | 0.2 0.015 250 | secondary surfaces                |
| success    | 0.64 0.17 150 | calories / macro on-target        |
| warning    | 0.76 0.15 85  | challenge / streak indicators     |
| destructive| 0.58 0.2 25   | errors, delete                    |

## Typography

- Display: Space Grotesk — headings, hero, rank tiers
- Body: DM Sans — UI labels, paragraphs, chat
- Mono: JetBrains Mono — calorie/macro/XP numeric readouts
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered dark surfaces (background → card → popover) with subtle borders and a refined shadow hierarchy (`shadow-card`/`shadow-elevated`/`shadow-lift`); depth from surface layering plus precise hover lifts, not glow.

## Structural Zones

| Zone    | Background | Border   | Notes                                  |
| ------- | ---------- | -------- | -------------------------------------- |
| Sidebar | card       | border-r | fixed nav, neon active state           |
| Header  | background | border-b | sticky, page title + profile           |
| Content | background | —        | cards alternate muted/40 for rhythm    |
| Footer  | muted/40   | border-t | minimal, credits                       |

## Spacing & Rhythm

Generous section gaps (`gap-6 md:gap-8`), consistent card padding (`p-5 md:p-6`), tight micro-spacing inside stats; consistent gutters with `--radius` bumped to 0.875rem for a softer premium edge.

## Component Patterns

- Buttons: `rounded-lg`, neon primary for CTAs, muted secondary, `hover-lift` + `press` feedback
- Cards: `rounded-xl`, card background, `shadow-card`, `hover-lift` on hover, `focus-ring` for keyboard
- Badges: `rounded-full` pills, neon for rank/XP, success for on-target, warning for streaks
- Progress: linear bars + circular donut for calories/macros, neon fill, shimmer skeleton loading

## Motion

- Entrance: `animate-rise` / `animate-slide-up` on page/section mount; `stagger` for card grids
- Hover: `hover-lift` (translateY + shadow + border) and `press` scale on interactive elements
- Focus: `focus-ring` neon ring on all focusable elements
- Decorative: `animate-pulse-soft` on live/active indicators, `animate-shimmer` on skeletons
- Reduced motion: all entrance animations disabled under `prefers-reduced-motion`

## Constraints

- Dark mode is the primary experience; light mode kept coherent
- Neon blue is the only saturated accent — use sparingly for highlights and active states
- Token-only styling; never raw hex/rgb in components
- AA+ contrast maintained on all text/surfaces
- Every interactive element has a transition, hover state, and visible focus ring

## Signature Detail

Mono JetBrains numeral readouts for calories, macros, and XP against neon blue progress fills — turning data into the hero of the interface, elevated by a choreographed rise-in motion system.
