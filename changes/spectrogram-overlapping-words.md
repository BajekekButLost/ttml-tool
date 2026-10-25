---
type: fix
impact: 3
highlight: false
---
Stretching overlapping words in the spectrogram keeps the overlap

When two words on a line overlap, as background vocals often do, each now has its own end and start handle. Dragging one no longer snaps the other word to it.
