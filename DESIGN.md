# Design Brief

## Direction

Torque Fit — a dark, high-energy gym/fitness app with a near-black ChatGPT-style surface and electric neon blue accents.

## Tone

Bold, technical, athletic — a "performance instrument" aesthetic: brutally minimal dark surfaces with one dominant neon blue accent used sparingly for energy and focus.

## Differentiation

Neon blue as a single disciplined accent on near-black surfaces, with Space Grotesk display type and mono numeric stats, reads like a premium performance dashboard rather than a generic fitness app.

## Color Palette

| Token      | OKLCH         | Role                              |
| ---------- | ------------- | --------------------------------- |
| background | 0.13 0.012 250| near-black app canvas             |
| foreground | 0.93 0.01 250 | primary text                      |
| card       | 0.165 0.014 250| elevated surface panels          |
| primary    | 0.62 0.19 240 | neon blue accent / CTAs           |
| accent     | 0.62 0.19 240 | highlights, active states         |
| muted      | 0.2 0.015 250 | secondary surfaces                |
| success    | 0.62 0.17 150 | calories / macro on-target        |
| warning    | 0.75 0.15 85  | challenge / streak indicators     |
| destructive| 0.58 0.2 25   | errors, delete                    |

## Typography

- Display: Space Grotesk — headings, hero, rank tiers
- Body: DM Sans — UI labels, paragraphs, chat
- Mono: JetBrains Mono — calorie/macro/XP numeric readouts
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered dark surfaces (background → card → popover) with subtle borders and low-key `shadow-subtle`/`shadow-elevated`; depth comes from surface layering, not glow.

## Structural Zones

| Zone    | Background | Border   | Notes                                  |
| ------- | ---------- | -------- | -------------------------------------- |
| Sidebar | card       | border-r | fixed nav, neon active state           |
| Header  | background | border-b | sticky, page title + profile           |
| Content | background | —        | cards alternate muted/40 for rhythm    |
| Footer  | muted/40   | border-t | minimal, credits                       |

## Spacing & Rhythm

Generous section gaps (`gap-6 md:gap-8`), consistent card padding (`p-5 md:p-6`), tight micro-spacing inside stats; grid of cards with consistent gutters.

## Component Patterns

- Buttons: `rounded-lg`, primary neon blue for CTAs, muted secondary, subtle hover lift
- Cards: `rounded-xl`, card background, `shadow-subtle`, border-border
- Badges: `rounded-full` pills, neon blue for rank/XP, success for on-target, warning for streaks
- Progress: linear bars + circular donut for calories/macros, neon blue fill

## Motion

- Entrance: `animate-fade-in` (0.4s) on page/section mount
- Hover: `transition-smooth` color/opacity shifts on buttons and cards
- Decorative: `animate-pulse-soft` on live/active indicators only

## Constraints

- Dark mode is the primary experience; light mode kept coherent
- Neon blue is the only saturated accent — use sparingly for highlights and active states
- Token-only styling; never raw hex/rgb in components
- AA+ contrast maintained on all text/surfaces

## Signature Detail

Mono JetBrains numeral readouts for calories, macros, and XP against neon blue progress fills — turning data into the hero of the interface.
