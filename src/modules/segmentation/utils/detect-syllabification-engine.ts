import { francAll } from "franc-min";
import type { LyricLine } from "$/types/ttml";
import type { SegmentationEngineId } from "../types";

const engineForLanguage: Record<string, SegmentationEngineId> = {
	eng: "prosodic",
	spa: "silabas",
	fra: "syllabify-fr",
	deu: "hyphenation-de",
	ind: "hyphenation-id",
	ita: "hyphenation-it",
	pol: "hyphenation-pl",
	por: "hyphenation-pt",
	rus: "syllabify",
	jpn: "japanese",
	cmn: "basic",
	kor: "basic",
	en: "prosodic",
	es: "silabas",
	fr: "syllabify-fr",
	de: "hyphenation-de",
	id: "hyphenation-id",
	it: "hyphenation-it",
	pl: "hyphenation-pl",
	pt: "hyphenation-pt",
	ru: "syllabify",
	ja: "japanese",
	zh: "basic",
	ko: "basic",
};

const extractLyricsText = (lyricLines: LyricLine[]) =>
	lyricLines
		.map((line) => line.words.map(({ word }) => word).join(""))
		.join("\n")
		.trim();

/** Suggests the best available engine without changing the saved preference. */
export const detectSyllabificationEngine = (lyricLines: LyricLine[]) => {
	const text = extractLyricsText(lyricLines);
	if (!text) return undefined;
	const declared = new Map<SegmentationEngineId, number>();
	let declaredTotal = 0;
	for (const line of lyricLines) {
		if (!line.language || line.language === "auto") continue;
		const language = line.language.toLowerCase().split(/[-_]/)[0];
		const size = line.words.reduce(
			(count, word) => count + (word.word.match(/\p{L}/gu)?.length ?? 0),
			0,
		);
		declaredTotal += size;
		const engine = engineForLanguage[language] ?? "basic";
		declared.set(engine, (declared.get(engine) ?? 0) + size);
	}
	const explicit = [...declared].sort((a, b) => b[1] - a[1])[0];
	if (explicit && explicit[1] > declaredTotal * 0.6) return explicit[0];
	const letters = text.match(/\p{L}/gu)?.length ?? 0;

	const kana =
		text.match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
	const han = text.match(/\p{Script=Han}/gu)?.length ?? 0;
	if (kana > 0 && kana + han > letters * 0.7 && kana > letters * 0.1)
		return "japanese" as const;
	const hangul = text.match(/\p{Script=Hangul}/gu)?.length ?? 0;
	if (han > letters * 0.7 || hangul > letters * 0.7) return "basic" as const;

	const results = francAll(text, { minLength: 20 });
	const [best, next] = results;
	if (!best || best[0] === "und" || (next && best[1] - next[1] < 0.05))
		return undefined;
	return engineForLanguage[best[0]];
};

export const matchesSavedSyllabificationEngine = (
	lyricLines: LyricLine[],
	savedEngine: SegmentationEngineId,
) => {
	const suggested = detectSyllabificationEngine(lyricLines);
	return suggested === undefined || suggested === savedEngine;
};
