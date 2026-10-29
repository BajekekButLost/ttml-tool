---
type: fix
impact: 4
highlight: true
---
Reduce background work while syncing lyrics

Keep syncing responsive in long songs by avoiding repeated section searches and unnecessary word-highlight updates. Reuse unchanged preview tokens, animate only mounted preview rows, and release animation state for rows that leave the viewport.

Release collapsed spectrogram workers and audio copies, bound bitmap memory and queued analysis, and discard obsolete tiles after settings change.

Avoid unrelated waveform and project-header updates on sync presses. Coalesce presence publication and autosaves, and keep an older save from reporting newer edits as saved.

Prepare time-stretched audio in a dedicated worker so expensive processing cannot block the audio device callback. Keep buffered playback bounded and preserve exact seeking, pitch, and audition endpoints.

Prepare custom segmentation matchers once per batch instead of rebuilding them for every word.

Cancel obsolete decoder-worker jobs on audio replacement, remove redundant playback update timers, and move Discord IPC off the desktop event thread.
