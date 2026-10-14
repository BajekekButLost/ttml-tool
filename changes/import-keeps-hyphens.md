---
type: fix
impact: 2
highlight: false
---
Importing with Process Lyrics off keeps hyphenated words whole

With Process Lyrics turned off, the lyrics import used to split every line after its hyphens, so "twenty-one" came in as two words. Those lines now import as-is. With Process Lyrics on, hyphenated words are still split as before.
