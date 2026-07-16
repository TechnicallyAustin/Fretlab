# Jada Commercial Product Leadership Knowledge OS

Jada is a focus-first professional development system for learning, practicing, and proving commercial product leadership skills.

The product organizes one profession as:

```text
Track → Domain → Competency → Capability → Lesson
```

Capabilities connect learning to projects, validation, reflection, and portfolio evidence. Role lenses reprioritize the same knowledge map for eight commercial career paths.

## Product areas

- Home: one next action, a readable eight-domain map, and the mastery loop.
- My Path: interactive role lenses and four sequenced modules per role.
- Knowledge Map: all domains, competencies, and capabilities.
- Domain tutors: one copy-ready Socratic Claude prompt per domain, with domain-specific metaphors, questions, focus blocks, completion checks, and next-domain handoff.
- Projects: staged Foundation, Applied, Integrated, and Capstone work.
- Portfolio: evidence artifacts and senior-proof quality standards.
- Capability workspaces: theory, methods, tools, lessons, evidence, and validation.
- Lesson workspaces: focused reading, short practice, knowledge check, and completion.

Learner progress is saved locally on the current device.

## Accessibility and design system

The visual language is implemented as reusable components in `components/design-system/`. Full usage guidance, tokens, content rules, and accessibility requirements are in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

The system prioritizes:

- Verdana-first readable typography
- 17px body copy and 15px supporting text
- generous line and paragraph spacing
- strong text contrast
- short, left-aligned content blocks
- visible keyboard focus and 48px minimum interactive targets
- one primary action per section
- reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

The application uses the existing vinext and Sites-compatible build structure.
