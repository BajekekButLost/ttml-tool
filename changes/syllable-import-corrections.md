---
type: fix
impact: 4
highlight: false
---
Keep import preparation and manual syllable corrections consistent

Import preparation keeps kana combinations intact and lets the selected engine replace generated CJK cuts. Manual marks, repeated separators, and the chosen hyphen policy are preserved. Correction controls announce each complete-character boundary and its state. Combining syllables can remember a no-split correction, language suggestions use line metadata and confidence, and rejected suggestions or insufficient draft timings trigger review feedback.
