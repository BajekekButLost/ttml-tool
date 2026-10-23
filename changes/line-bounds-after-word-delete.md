---
type: fix
impact: 3
highlight: false
---
Deleting words updates the line's start and end

Deleting words with **Delete** now shrinks the line to the words that are left, like the right-click delete already did. Trailing spaces no longer hold the old end in place. Duplicating a line and trimming each copy no longer leaves both highlighted as current.
