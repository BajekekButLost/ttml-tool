---
type: fix
impact: 4
highlight: true
---
Reduce background work while syncing lyrics

Keep syncing responsive in long songs by avoiding repeated section searches and unnecessary word-highlight updates. Reuse unchanged preview tokens, animate only mounted preview rows, and release animation state for rows that leave the viewport.

Release collapsed spectrogram workers and audio copies, bound bitmap memory and queued analysis, and discard obsolete tiles after settings change.
