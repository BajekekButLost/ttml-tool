---
type: fix
impact: 4
highlight: true
---
Reduce background work while syncing lyrics

Reduce work while syncing long songs by reusing preview models and segmentation matchers, avoiding unnecessary highlight and document updates, and coalescing autosave and presence updates.

Prepare stretched audio outside the device callback, cancel obsolete decoder jobs, and release collapsed spectrogram workers with bounded tile memory and preserved editing drafts.
