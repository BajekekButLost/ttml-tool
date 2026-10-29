import nlp from "compromise/tokenize";
import nlpSpeech from "compromise-speech";
import silabas from "silabas";
import syllabify from "syllabify";
import syllabifyFr from "syllabify-fr";
import { graphemes, mapSourceSlices, preservesSource } from "$/utils/graphemes";
import { isKanaModifier as isJapaneseModifier } from "$/utils/japanese";

export { splitJapaneseRun } from "$/utils/japanese";

import prosodicDictionary from "../data/prosodic-dict.json";
import type { SegmentationEngineId } from "../types";

type DictionaryEntry = number | number[];

export interface SyllabificationEngine {
	id: SegmentationEngineId;
	name: string;
	description: string;
	split: (word: string) => string[];
}

const hyphenationLanguages = [
	["en-us", "English (US)", true],
	["de", "German", false],
	["fr", "French", true],
	["es", "Spanish", true],
	["id", "Indonesian", false],
	["it", "Italian", false],
	["pt", "Portuguese", false],
	["ru", "Russian", true],
	["pl", "Polish", false],
] as const;

export const getHyphenationLanguage = (engine: SegmentationEngineId) =>
	engine.startsWith("hyphenation-")
		? engine.slice("hyphenation-".length)
		: undefined;

const dictionary = new Map<string, DictionaryEntry>(
	Object.entries(prosodicDictionary as Record<string, DictionaryEntry>),
);
const nlpWithSpeech = nlp.extend(nlpSpeech as never);

const splitAtLengths = (word: string, lengths: number[]) => {
	const boundaries = lengths.reduce<number[]>((result, length) => {
		result.push((result[result.length - 1] ?? 0) + length);
		return result;
	}, []);
	const parts: string[] = [];
	let start = 0;
	for (const end of boundaries) {
		parts.push(word.slice(start, end));
		start = end;
	}
	parts.push(word.slice(start));
	return parts.filter(Boolean);
};

const compromiseSplit = (word: string) => {
	const normalize = (value: string) =>
		value
			.normalize("NFD")
			.replace(/\p{M}/gu, "")
			.replace(/’/g, "'")
			.toLowerCase();
	const syllables = (
		nlpWithSpeech(normalize(word)).syllables() as string[][]
	).flat();
	if (syllables.length <= 1) return [word];
	return mapSourceSlices(word, syllables, normalize) ?? [word];
};

const mergeContractionSuffix = (parts: string[]) => {
	const result: string[] = [];
	for (const part of parts) {
		if (/^[’'](?:s|re|ve|ll|d|m|t)$/i.test(part) && result.length > 0) {
			result[result.length - 1] += part;
		} else {
			result.push(part);
		}
	}
	return result;
};

const prosodicSplit = (word: string) => {
	const key = word.normalize("NFC").toLowerCase().replace(/’/g, "'");
	if (
		/^(?:y'all|(?:could|would|should|might|must|we|you|they|i|he|she|it|that|there|who|what|let)(?:'s|'re|'ve|'ll|'d|'m)|(?:can|won|don|doesn|didn|isn|aren|wasn|weren|hasn|haven|hadn|couldn|wouldn|shouldn|mustn|needn)'t)$/i.test(
			key,
		)
	)
		return [word];
	const elided = key.replace(/'$/, "");
	const entry =
		dictionary.get(key) ??
		(elided.endsWith("in") ? dictionary.get(`${elided}g`) : undefined);
	if (entry !== undefined) {
		return splitAtLengths(word, typeof entry === "number" ? [entry] : entry);
	}
	return mergeContractionSuffix(compromiseSplit(word));
};

const isJapaneseCharacter = (char: string | undefined) =>
	!!char &&
	/[々\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(char);
const isJapanesePunctuation = (char: string | undefined) =>
	!!char && /[\p{P}\p{S}]/u.test(char);

/** Adapted from amll-dev/amll-editor's Japanese basic engine. */
export const splitJapaneseText = (text: string) => {
	if (!text.trim()) return [text];
	const chars = graphemes(text);
	const tokens: string[] = [];
	let index = 0;
	while (index < chars.length) {
		const token: string[] = [];
		if (isJapaneseCharacter(chars[index])) {
			token.push(chars[index++]);
			while (isJapaneseModifier(chars[index])) token.push(chars[index++]);
			while (isJapanesePunctuation(chars[index])) token.push(chars[index++]);
			tokens.push(token.join(""));
			continue;
		}
		while (
			index < chars.length &&
			!isJapaneseCharacter(chars[index]) &&
			!isJapanesePunctuation(chars[index]) &&
			!/^\s$/u.test(chars[index] ?? "")
		) {
			token.push(chars[index++]);
		}
		while (isJapanesePunctuation(chars[index])) token.push(chars[index++]);
		if (token.length > 0) tokens.push(token.join(""));
		if (index < chars.length && /^\s$/u.test(chars[index] ?? "")) {
			tokens.push(chars[index++]);
		}
	}
	return tokens;
};

export const SYLLABIFICATION_ENGINES: SyllabificationEngine[] = [
	{
		id: "prosodic",
		name: "English (Prosodic)",
		description:
			"Dictionary-backed English syllable boundaries with a speech fallback.",
		split: prosodicSplit,
	},
	{
		id: "basic",
		name: "Basic",
		description:
			"Keep Latin words whole and split CJK text using the existing rules.",
		split: (word) => [word],
	},
	{
		id: "japanese",
		name: "Japanese (Basic)",
		description:
			"Use the existing CJK character splitting rules for Japanese text.",
		split: (word) => [word],
	},
	{
		id: "silabas",
		name: "Spanish (Silabas)",
		description: "Spanish orthographic syllable splitting.",
		split: (word) => {
			try {
				return silabas(word).syllables();
			} catch {
				return [word];
			}
		},
	},
	{
		id: "syllabify-fr",
		name: "French (Syllabify-fr)",
		description: "French orthographic syllable splitting.",
		split: (word) => syllabifyFr(word).syllabes,
	},
	{
		id: "syllabify",
		name: "Russian (Syllabify)",
		description: "Russian orthographic syllable splitting.",
		split: (word) => {
			try {
				return syllabify(word);
			} catch {
				return [word];
			}
		},
	},
	...hyphenationLanguages.map<SyllabificationEngine>(
		([language, name, hasBetterEngine]) => ({
			id: `hyphenation-${language}`,
			name: `${name}${hasBetterEngine ? " (legacy)" : ""}`,
			description: `Use the existing ${name} hyphenation patterns.`,
			split: (word) => [word],
		}),
	),
	{
		id: "none",
		name: "None",
		description: "Do not split words automatically.",
		split: (word) => [word],
	},
];
SYLLABIFICATION_ENGINES.sort((left, right) =>
	left.name.localeCompare(right.name),
);

export const getSyllabificationEngine = (id: SegmentationEngineId) =>
	SYLLABIFICATION_ENGINES.find((engine) => engine.id === id) ??
	SYLLABIFICATION_ENGINES.find((engine) => engine.id === "none") ?? {
		id: "none" as const,
		name: "None",
		description: "Do not split words automatically.",
		split: (word: string) => [word],
	};

const splitCache = new Map<string, string[]>();

for (const engine of SYLLABIFICATION_ENGINES) {
	const split = engine.split;
	engine.split = (word) => {
		const key = `${engine.id}\u0000${word}`;
		const cached = splitCache.get(key);
		if (cached) return [...cached];
		let result = [word];
		try {
			const proposal = split(word);
			result = preservesSource(word, proposal)
				? proposal
				: (mapSourceSlices(word, proposal) ?? [word]);
		} catch {
			result = [word];
		}
		if (splitCache.size >= 4096) splitCache.clear();
		splitCache.set(key, result);
		return [...result];
	};
}
