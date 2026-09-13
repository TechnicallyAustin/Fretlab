# FretLab UI

Every distinct piece of the shipped screens, pulled out as one component. No
dependencies beyond React. Styling is plain CSS with custom properties, so it
drops in next to the generated `web/src/design/` output without fighting it.

```
src/
  tokens.css          colour, type, shape, key hue
  fretlab-ui.css      one class block per component
  primitives/         buttons, pills, tags, cards, section furniture
  shell/              app frame, sidebar, nav, top bar, key picker
  fretboard/          the neck renderer and its legend
  cards/              hero, session, song, scale, chord, drill, tuner, key rows
  practice/           tabs, steps, goal, tempo ladder, metronome
  progress/           week strip, interactive 13-week heatmap
  keys/               circle of fifths, degree chips
  media/              editorial hero, practice rails, persistent player
showcase/
  Gallery.tsx         every component in isolation
  gallery.html        prebuilt, open it in a browser
```

## Install

Copy `src/` to `web/src/ui/` and import the barrel:

```tsx
import { AppShell, Fretboard, DrillCard } from "@/ui";
```

`src/index.ts` imports the stylesheet, so nothing else to wire up. Mount
`showcase/Gallery.tsx` at `/ui` to keep the specimen page alongside the app.

## The two things that carry state across the whole library

**Key colour.** `--fl-key-h` is one number. `KeyPicker`, `KeyBadge`, `SongCard`,
`ChordCard`, `NeighbourRow` and `DegreeChips` all accept a `hue` prop and set it
locally; set it on `:root` for a global key. `keyHue(fifthsIndex)` reproduces the
API's `289 + fifths * 30`, so the client never invents a colour the server
didn't compute.

**Markers.** Every neck in the app is `Fretboard` with a different marker array.
Full neck map, card thumbnail, numbered drill path, chord shape: same renderer,
same `{ stringIndex, fret, tone, label }` record. `stringIndex` is 0 at the top
row as drawn. Transposing is still one integer, matching how `Exercise` already
stores fret offsets.

```tsx
<Fretboard
  markers={[{ id: "a", stringIndex: 5, fret: 8, label: 1, tone: "root", shape: "square" }]}
  path={["a", "b", "c"]}   // dashed trail in playing order
  window={[7, 10]}         // shade the position
/>
```

## Inventory, by where it came from

| Screen | Components |
| --- | --- |
| All screens | `AppShell` `BrandMark` `Nav` `NavItem` `ExploreList` `SidebarNote` `TopBar` `StatusPill` `IconButton` `KeyPicker` `Button` `CornerStamp` `PageTitle` |
| Today | `SessionCard` `Stat` `WeekStrip` `Heatmap` `HeatLegend` `EmptyState` `SegmentedControl` `GoalBar` `Fretboard` `Legend` `MetronomeDial` |
| Drill library | `Hero` (light) `GuidedRoutineCard` `PillGroup` `DrillCard` `Tag` `LevelBadge` `ProgressDots` `FretboardMini` |
| Drill detail | `Tabs` `StepStrip` `WhyThisDrill` `FinishLineCard` `GoalBar` `TempoLadder` `Stepper` `HearButton` `Fretboard` (path + window) `Legend` |
| Library index | `LibraryTile` `TheoryCallout` |
| Key explorer | `CircleOfFifths` `DegreeChips` `NeighbourRow` `ArrowLink` |
| Chord library | `Hero` `PillGroup` `ChordCard` `ChordDiagram` |
| Scale library | `Hero` `ScaleCard` `FretboardMini` |
| Songs | `Hero` `HeroSearch` `SegmentedControl` `SongCard` |
| Tuner | `TunerPrompt` `TunerMeter` `TuningList` `StringRow` |
| Practice home | `PracticeHero` `MediaShelf` `MediaCard` `PracticePlayer` |

## Decisions worth knowing about

- **Numbers only where there is a sequence.** Nav indices, scale library
  indices and `StepStrip` are ordered, so they keep their numbers. Nothing else
  gets a decorative `01`.
- **One legend component.** The legend on the practice studio and the one on the
  drill detail were different lists of the same swatches. `Legend` takes the
  keys it should show, so they can never drift apart.
- **One heat ramp.** `WeekStrip`, `Heatmap` and `HeatLegend` share a single
  `fill()` so the shade for 20 minutes is the same in all three. The default
  heatmap includes seven days by 13 weeks, square cells, month labels and an
  optional controlled day selection.
- **Icon-only buttons require a label.** `IconButton` takes `label` as a
  required prop and sets both `aria-label` and `title`.
- **Motion explains state.** Press, audition, metronome beat, listening and pitch-correction motion share the same timing tokens. Reduced motion is respected globally.
- **The tuner promise travels with the button.** `TunerPrompt` holds the
  microphone copy so the button is never shipped without it.

## Control system 3.0

The controls now share three heights (`32 / 40 / 48`), a 140 ms direct-feedback
duration, a three-pixel focus signal, and consistent hover/pressed/disabled
states. Cards use the same elevation ramp, while instrument controls can opt
into the slower 240 ms state transition.

`TunerMeter` keeps audio acquisition separate from rendering: connect a pitch
detector by passing the detected `note`, `octave`, signed `cents`, `detectedHz`,
`confidence`, and `signalLevel`. It clamps visual input to ±50 cents, announces
the current result, exposes string targeting and completion state, supports
demo/live input modes, and includes an adjustable A4 reference pitch.

```tsx
<TunerMeter
  note="E"
  octave={2}
  cents={-3.4}
  detectedHz={82.24}
  confidence={0.94}
  signalLevel={0.57}
  listening={listening}
  activeString={6}
  onStringChange={setActiveString}
  onToggle={toggleMicrophone}
/>
```

The gallery's `TunerPro` specimen includes a working Web Audio microphone path,
autocorrelation pitch detection, four tuning presets, confidence and input
telemetry, sustained-pitch locking, and a safe simulated signal mode. Serve the
gallery from localhost or HTTPS to exercise microphone input.

The gallery also includes production interaction specimens for async/success/
undo button states, split-button menus, keyboard-driven filter pills, removable
semantic labels, an adaptive media card, a guided fretboard studio, and a
91-day progress heatmap. Each specimen is functional with pointer and keyboard
input and falls back to reduced motion when requested.

### Light streaming experience

The product remains light-first. Streaming-product influence comes from
editorial scale, cinematic artwork, horizontal continuation rails, progressive
disclosure, and a persistent practice transport—not from a permanently dark
shell. `PracticePlayer` exposes playback, previous/next, loop, metronome, BPM,
timeline, volume, and save state as controlled props.

## Not included

- Photography. `Hero`, `SessionCard`, `SongCard` and `LibraryTile` take an
  `image` prop and render fine without one.
- Audio. `HearButton`, `MetronomeDial` and `StringRow` expose handlers only.
- Routing. Every navigational component takes a callback rather than a link, so
  react-router stays outside the library.

## Regenerating the preview

```
npm i -D esbuild react react-dom typescript @types/react
node build-preview.mjs   # writes showcase/gallery.html
node ssr-check.mjs       # renders the gallery, fails loudly on undefined/NaN
```
