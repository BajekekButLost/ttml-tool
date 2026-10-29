---
type: fix
impact: 4
highlight: false
---
Use the chosen splitting engine and protect correction drafts

All splitting actions wait for the correct language patterns and report loading failures. The split dialog supports every engine, preserves manual edits while patterns load, and checks its source before applying. Suggestions use current word IDs and timing. Remembered corrections are scoped to their engine, and timing and hyphenation limitations are explained in every locale.
