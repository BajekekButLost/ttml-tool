import type { TTMLLyric } from "$/types/ttml";

/** Keep supported word fields when loading or saving older documents. */
export function normalizeDocumentWords(lyric: TTMLLyric): TTMLLyric {
	return {
		...lyric,
		lyricLines: lyric.lyricLines.map((line) => ({
			...line,
			words: line.words.map((word) => ({
				id: word.id,
				word: word.word,
				startTime: word.startTime,
				endTime: word.endTime,
				obscene: word.obscene,
				romanWord: word.romanWord ?? "",
				...(word.romanWarning === undefined
					? {}
					: { romanWarning: word.romanWarning }),
			})),
		})),
	};
}
