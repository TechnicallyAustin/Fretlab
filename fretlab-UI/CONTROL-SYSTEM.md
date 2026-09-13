# FretLab control system 3.0

FretLab's controls use one interaction language across browsing, learning,
practice, and real-time instrument tools.

The visual direction is light-first: warm white canvas and layered daylight
surfaces carry the app. Cinematic media is contained inside artwork, fretboard,
and instrument surfaces so contrast feels intentional rather than global.

## Foundations

| Concern | Standard |
| --- | --- |
| Control heights | 32 px compact, 40 px default, 48 px prominent |
| Direct feedback | 140 ms using `--fl-ease-out` |
| State transition | 240 ms using `--fl-ease-out` |
| Focus | 3 px high-contrast halo plus a 1 px accent edge |
| Touch feedback | 0.97 scale while pressed |
| Selection | Surface lift plus accent boundary; never color alone |
| Reduced motion | All repeated and decorative animation stops |
| Density | Comfortable and compact presentation without changing semantics |

## Component contracts

- Buttons: primary is reserved for the next or highest-confidence action.
  Outline is neutral, quiet is tertiary, and on-dark is for media surfaces.
  Loading disables repeat submission and exposes `aria-busy`.
- Icon buttons: always require an accessible `label`; they use the same 40 px
  footprint as default buttons.
- Pills: filter a broad collection. Segmented controls switch between two to
  four mutually exclusive peer views. Tabs switch document sections. Pill
  groups use roving focus and support arrow, Home, and End keys.
- Steppers: use bounded changes where each increment is meaningful. The edge
  buttons disable at `min` and `max`; the value is announced after changes.
- Cards: interactive cards lift by three pixels and gain stronger elevation.
  Nested actions must stop propagation so audition does not also open a card.
- Fretboard markers: interactive markers are keyboard-addressable and announce
  their note, string, and fret. `activeMarkerId` drives guided playback and
  `onMarkerFocus` keeps a detail inspector synchronized.
- Labels: removable tags expose a named remove action. Live, count, sync, and
  notification labels always state meaning in text rather than color alone.
- Progress heatmaps: the default view covers 13 weeks / 91 days with all seven
  weekdays. Cells are square buttons, provide minute-level accessible names,
  and can expose a controlled selection through `selected` and `onSelect`.
- Fields: text, select, switch, and range inputs share the same label, hint,
  focus, error, disabled, and geometry contracts.

## Instrument surfaces

### Practice media

`PracticeHero` provides the editorial entry point, `MediaShelf` and `MediaCard`
create horizontally scannable continuation rails, and `PracticePlayer` keeps
the active exercise accessible without losing page context. The player exposes
controlled playback, previous/next, loop, metronome, BPM, timeline, volume, and
save state. On phones it collapses to track identity plus the primary transport
action while preserving the complete state model.

### Tuner

`TunerMeter` separates audio analysis from rendering. Feed it a note, octave,
signed cents, detected frequency, signal level, and confidence value. The
needle clamps to ±50 cents and a pitch locks after sustained frames inside the
±5-cent window. Players can target a string, see completed strings, monitor
input quality, change A4 from 430–450 Hz, and start or stop listening from one
surface.

The gallery defaults to simulated pitch input so all motion and controls can be
tested without requesting microphone permission. Its microphone mode uses Web
Audio with echo cancellation, noise suppression, and automatic gain disabled,
then runs normalized autocorrelation locally. It requires localhost or HTTPS.

### Metronome

The ring, beat indicators, numeric BPM, range, step controls, and tap-tempo
input all describe the same state. `--fl-beat-duration` keeps the visual pulse
locked to BPM. Audio timing can remain in the host app and drive the `beat`
prop for sample-accurate UI feedback.

## Accessibility checklist

- Every icon-only action has an accessible name.
- Keyboard activation works for custom string rows and fretboard markers.
- Pill groups and the 13-week heatmap support spatial arrow-key navigation.
- Live tuner and stepper readouts announce changes without moving focus.
- Selection uses shape, boundary, and elevation in addition to color.
- Instrument animation and smooth scrolling respect reduced-motion preference.
- The gallery is responsive without horizontal page overflow at 390 px.
