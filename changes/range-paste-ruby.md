---
type: fix
impact: 2
highlight: false
---
Duplicate-pasting into a spectrogram range moves ruby timings too

Pasting lines into a selected range now spreads each ruby part across its word's new timing, instead of leaving it at the copied line's old position.
