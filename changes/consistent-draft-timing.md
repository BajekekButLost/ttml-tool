---
type: fix
impact: 2
highlight: false
---
Reliable draft word timings

Segmentation, Line Sync, and spectrogram initialization now distribute whole-millisecond times without rounding gaps, overlaps, or negative final durations. Whitespace gets zero duration, and zero-weight segments are preserved.
