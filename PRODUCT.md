# Audio Visualizer

## What it is

A browser audio visualizer by Snorre. It listens to an audio source and renders
it as live generative graphics — a WebGL 3D layer (Three.js) and a 2D canvas
layer that can run separately or stacked.

Single self-contained static page: `index.html` + `visualizer.js` + a vendored
`three.min.js`. No build step, no framework, no package manager, no network
dependency at runtime except webfonts. It must stay openable by double-clicking
the file.

## Unique mechanism

Everything on screen is derived from live FFT analysis of whatever is playing —
a kick-band beat detector drives shape morphs, camera kicks, comet spawns and
palette changes, and an Auto-VJ mode performs the whole instrument on its own,
rotating shapes, modes, symmetry and colour on the beat.

## Who it is for

Snorre first, then anyone who wants visuals behind music. The real scene is a
darkened room with music loud, the page fullscreen on a second display or a
projector, watched from across the room — not read at desk distance.

## Surface mode

**Operate.** The panel is an instrument's control surface. The visuals are the
product; the chrome exists to drive them and must never compete with them.
Scanability and reach outrank expression. It is used mid-performance, sometimes
one-handed, sometimes in the dark.

## Audio sources

Microphone, an uploaded/dropped file, system or tab audio via `getDisplayMedia`,
plus a synthesized demo tone and beat demo for when nothing else is available.

## Content

- 14 3D shapes (abstract, creatures, objects) with morph transitions
- 21 2D modes, several named after Winamp/WMP visualizations
- 9 colour presets plus custom, hue-cycle, and Auto-VJ palette generation
- Post-processing: bloom, RGB split, feedback, screen shake, fog, camera paths
- Web MIDI knob binding, keyboard shortcuts for every action, hide-UI mode

## Constraints

- Performance is a feature: it must hold framerate while audio-reactive, so
  there is auto quality scaling and a manual quality ceiling.
- Everything must survive with no audio playing (silent state is a real state).
- Keyboard-first: the whole instrument is playable without the mouse.
- The UI must be able to disappear completely (`H`) for clean projection.

## Brand commitments

- Author credit "by Snorre" ships on the surface.
- Two named UI worlds ship and are switchable at runtime; both are first-class
  and held to the same finish bar. Neither is a degraded version of the other.
  Durable visual decisions for both live in DESIGN.md.
