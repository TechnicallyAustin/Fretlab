# Jada Calm Focus Design System

Jada uses a calm, high-focus visual system designed to reduce reading friction for people with ADHD, dyslexia, and dysgraphia. The interface favors short content blocks, strong hierarchy, generous whitespace, and one obvious action per section.

## Foundations

- Body type: Verdana first, with Tahoma and Arial fallbacks. Never rely on thin weights or italics for meaning.
- Base size: 17px minimum for reading text, 15px minimum for supporting labels, and 48px minimum touch targets.
- Reading rhythm: 1.65 line height, slightly expanded letter spacing, left alignment, and line lengths below 72 characters.
- Contrast: primary text uses `#171C35` on `#FFFFFF` or `#F6F7FB`. Supporting text uses `#4E5870`; never place low-contrast gray on a tinted surface.
- Focus: use one indigo primary action per group. Coral is a progress or attention accent, not body text.
- Shape: asymmetric rounded corners are part of the Jada identity. They do not encode state.
- Motion: brief, purposeful transitions only. All motion respects `prefers-reduced-motion`.

## Tokens

Tokens live at the top of `app/globals.css`.

- `--cloud`, `--paper`: page and reading surfaces.
- `--ink`, `--muted`: primary and secondary text.
- `--indigo`, `--indigo-dark`, `--indigo-soft`: action and selection.
- `--coral`, `--coral-soft`: progress and attention.
- `--aqua`, `--butter`: supportive category surfaces.
- `--line`, `--shadow`: boundaries and elevation.
- `--space-*`: shared spacing steps.

## Components

Import reusable components from `components/design-system`.

```tsx
import {
  FocusNotice,
  ProgressBar,
  SectionHeader,
  SubconceptCard,
  Surface,
} from "@/components/design-system";
```

### `Surface`

The standard bordered reading surface. Use `corner` to preserve the visual identity without recreating border, radius, or shadow rules.

```tsx
<Surface as="article" corner="bottom-left">...</Surface>
```

### `SectionHeader`

Creates a consistent eyebrow, heading, optional description, and one optional action. Keep descriptions to two short sentences.

### `ProgressBar`

Provides accessible `progressbar` semantics and an optional visible label. Values are clamped to 0–100.

### `SubconceptCard`

Use for capabilities, lessons, or sub-concepts within a directed sequence. It replaces dense pill groups and provides a larger reading and touch target.

### `FocusNotice`

Use once per workspace to state the learner's immediate goal or next action. Do not stack multiple notices.

## Content rules

1. Put the decision or next action first.
2. Keep paragraphs under four lines on desktop.
3. Break procedures into numbered steps.
4. Present no more than four peer choices before grouping or filtering.
5. Use plain verbs: Learn, Try, Build, Check, Reflect.
6. Avoid all-caps sentences, long italics, justified text, and instructions conveyed only by color.
7. Every button must change view, state, or progress. Never ship a decorative button.

## Adding a new screen

1. Start with the page header and one `FocusNotice`.
2. Group content into `Surface` components.
3. Use `SectionHeader` for every major section.
4. Use `SubconceptCard` for selectable learning items.
5. Test keyboard order, visible focus, 200% zoom, and widths down to 320px.
6. Check that the screen still makes sense when color is removed.
