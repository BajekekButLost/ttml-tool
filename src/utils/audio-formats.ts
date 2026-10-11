/** Shared picker and file-open formats: the union of the existing entry points. */
export const AUDIO_EXTENSIONS = new Set([
	"mp3",
	"flac",
	"wav",
	"ogg",
	"m4a",
	"aac",
	"opus",
	"webm",
	"weba",
	"oga",
	"mid",
	"aiff",
	"wma",
	"au",
]);

export const AUDIO_FILE_FILTERS = [
	{ name: "Audio", extensions: [...AUDIO_EXTENSIONS] },
];
