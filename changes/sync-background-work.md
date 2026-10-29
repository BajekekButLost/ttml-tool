---
type: fix
impact: 4
highlight: true
---
Reduce lag while syncing long songs

The editor, preview, autosave and Discord status do less work on every edit, so syncing long songs stays responsive.

In the browser, the spectrogram uses at most two threads instead of every CPU core, which stopped it from slowing down the whole tool. Playback audio is prepared ahead of time instead of on the audio thread, and a closed spectrogram frees its memory.
