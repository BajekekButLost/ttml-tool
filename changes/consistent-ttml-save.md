---
type: fix
impact: 3
highlight: true
---
Consistent TTML saving and recovery

Save, guided export, clipboard copy, and project saves now share timing and section checks. Guided and recovery saves use the document name and update saved state after success; clipboard copy keeps unsaved changes. Recovery exports warn without waiting for an app dialog and can rescue a standalone copy if project saving fails.
