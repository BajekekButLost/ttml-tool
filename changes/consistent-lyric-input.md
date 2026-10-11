---
type: fix
impact: 3
highlight: true
---
Make lyric and audio imports consistent

LRC imports recognize repeated timestamps and metadata tags in every entry point. Online imports now keep the text importer's hyphen boundaries, and Process Lyrics uses the same background-vocal rules throughout. All Load Audio buttons accept the same formats, including AAC, and failed loads no longer become pending project audio. New suggested file and folder names preserve Unicode and avoid Windows-invalid names.
