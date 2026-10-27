---
type: fix
impact: 2
highlight: false
---
Sync keys do less work on long songs

Each **F**, **G** or **H** press used to re-render the menu bar and about a dozen closed dialogs, and rebuild data for every line. On a 180-line song that is now about 230 component renders per press instead of 500, and the closed dialogs no longer react to timing changes.
