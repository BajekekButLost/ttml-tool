---
type: fix
impact: 3
highlight: true
---
Updates on Windows stop putting the desktop shortcut back

Windows updates always ran the MSI installer, which re-creates its desktop shortcut on every upgrade, so deleting it never stuck. Updates now go through the regular setup installer, which leaves your shortcuts alone. If your copy was updated through the MSI before, the next update switches it over once: Windows asks to remove the old version (choose Yes and allow the admin prompt), and after that updates are quiet.
