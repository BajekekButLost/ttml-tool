---
type: fix
impact: 4
highlight: false
---
Preserve source spans when splitting romanized lyrics

Romanized splitting retains spaces and complete characters, uses line language, and shares the validated timing allocator. Kana and Korean readings use local conversion first. Uncertain compound readings stay intact for review. Repeated requests are deduplicated, operations can be cancelled, and delayed results cannot overwrite intervening edits.
