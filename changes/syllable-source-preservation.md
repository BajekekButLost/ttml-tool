---
type: fix
impact: 5
highlight: true
---
Preserve lyric text and Unicode characters when splitting syllables

Splitting keeps source spelling, punctuation order, and complete characters across languages. Saved corrections use consistent character boundaries, and unchanged words keep their original timestamps. Japanese suggestions keep small kana with their base; nasal, geminate, and long-vowel morae remain separate timing units.
