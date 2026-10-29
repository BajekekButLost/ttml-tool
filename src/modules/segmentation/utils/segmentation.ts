import { distributeTime as distributeUnitTimes } from "$/modules/lyric-editor/utils/distribute-time";
import { type LyricLine, type LyricWord, newLyricWord } from "$/types/ttml";
import { graphemes, preservesSource } from "$/utils/graphemes";
import { CharType, type SegmentationConfig } from "../types";
import {
	escapeRegExp,
	getCharType,
	getMergeDirection,
	MergeDirection,
	PUNCT_AMBIGUOUS_QUOTES,
} from "./charUtils";
import { applyLearnedRule } from "./learned-rules";
import {
	getHyphenationLanguage,
	getSyllabificationEngine,
	splitJapaneseRun,
} from "./syllabification-engines";

export interface SegmentationContext {
	isQuoteOpen: boolean;
}

function canonical(text: string): string {
	return text.normalize("NFC").toLowerCase();
}

function configuredParts(
	text: string,
	config: SegmentationConfig,
): string[] | null {
	const key = canonical(text);
	if ([...config.ignoreList].some((entry) => canonical(entry.trim()) === key))
		return [text];
	for (const [entry, parts] of config.customRules) {
		if (canonical(entry.trim()) !== key) continue;
		if (!Array.isArray(parts) || !preservesSource(entry, parts)) return [text];
		const chars = graphemes(text);
		const lengths = parts.map((part) => graphemes(part).length);
		let cursor = 0;
		const mapped = lengths.map((length) => {
			const part = chars.slice(cursor, cursor + length).join("");
			cursor += length;
			return part;
		});
		return preservesSource(text, mapped) ? mapped : [text];
	}
	return applyLearnedRule(text, config.learnedRules);
}

function autoTokenize(text: string, config: SegmentationConfig): string[] {
	const tokens: string[] = [];
	let run = "";
	let type: CharType | undefined;
	const flush = () => {
		if (!run) return;
		const rules = configuredParts(run, config);
		if (rules) tokens.push(...rules);
		else if (type === CharType.Cjk && config.splitCJK) {
			tokens.push(
				...(config.engine === "japanese"
					? splitJapaneseRun(run)
					: graphemes(run)),
			);
		} else if (type === CharType.Latin && config.splitEnglish) {
			const russian =
				config.engine === "syllabify" || config.engine === "hyphenation-ru";
			const eligible = russian
				? /^[\p{Script=Cyrillic}\p{M}'’]+$/u.test(run)
				: /^[\p{Script=Latin}\p{M}'’]+$/u.test(run);
			if (!eligible) tokens.push(run);
			else if (getHyphenationLanguage(config.engine)) {
				const proposal = config.hyphenator?.(run).split("\u00ad");
				tokens.push(
					...(proposal && preservesSource(run, proposal) ? proposal : [run]),
				);
			} else tokens.push(...getSyllabificationEngine(config.engine).split(run));
		} else tokens.push(run);
		run = "";
	};
	for (const char of graphemes(text)) {
		const current = getCharType(char);
		if (type !== current || current === CharType.Other) flush();
		run += char;
		type = current;
	}
	flush();
	return tokens;
}

function calculateWeight(token: string, config: SegmentationConfig): number {
	return graphemes(token).reduce((weight, char) => {
		const type = getCharType(char);
		return (
			weight +
			(type === CharType.Whitespace
				? 0
				: type === CharType.Other || /^['’]+$/u.test(char)
					? Math.max(
							0,
							Number.isFinite(config.punctuationWeight)
								? config.punctuationWeight
								: 0.2,
						)
					: 1)
		);
	}, 0);
}

function postProcess(
	tokens: string[],
	config: SegmentationConfig,
	context: SegmentationContext,
): string[] {
	const result: string[] = [];
	let prefix = "";
	for (const token of tokens) {
		const punctuation =
			!!token &&
			(getCharType(token) === CharType.Other || /^['’]+$/u.test(token));
		let direction = getMergeDirection(token);
		if (PUNCT_AMBIGUOUS_QUOTES.has(token)) {
			direction = context.isQuoteOpen
				? MergeDirection.Left
				: MergeDirection.Right;
			context.isQuoteOpen = !context.isQuoteOpen;
		}
		if (config.punctuationMode === "merge" && punctuation) {
			if (
				prefix ||
				direction === MergeDirection.Right ||
				!result.length ||
				!result[result.length - 1].trim()
			)
				prefix += token;
			else result[result.length - 1] += token;
		} else {
			if (!token.trim() && prefix) {
				result.push(prefix);
				prefix = "";
			}
			result.push(prefix + token);
			prefix = "";
		}
	}
	if (prefix) {
		if (result.length && result[result.length - 1].trim())
			result[result.length - 1] += prefix;
		else result.push(prefix);
	}
	return result.filter((token) => token !== "" || !config.removeEmptySegments);
}

function distributeTime(
	original: LyricWord,
	tokens: string[],
	weights: number[],
): LyricWord[] {
	if (tokens.length === 1 && tokens[0] === original.word) return [original];
	if (!preservesSource(original.word, tokens)) return [original];
	if (!tokens.length) return [];
	return distributeUnitTimes(
		tokens.map((token, index) => ({
			...original,
			id: index === 0 ? original.id : newLyricWord().id,
			word: token,
			romanWord: index === 0 ? original.romanWord : "",
			romanWarning: original.romanWarning || !!original.romanWord || undefined,
		})),
		original.startTime,
		original.endTime,
		{ weight: weights },
	);
}

function prepareProtectedPattern(config: SegmentationConfig): RegExp | null {
	const words = [
		...new Set(
			[...config.ignoreList, ...config.customRules.keys()]
				.map((word) => word.trim())
				.filter(Boolean),
		),
	];
	return words.length
		? new RegExp(
				`(?<![\\p{L}\\p{N}\\p{M}'’])(${words
					.sort((a, b) => b.length - a.length)
					.map(escapeRegExp)
					.join("|")})(?![\\p{L}\\p{N}\\p{M}'’])`,
				"giu",
			)
		: null;
}

export function segmentWord(
	word: LyricWord,
	config: SegmentationConfig,
	context?: SegmentationContext,
	pattern = prepareProtectedPattern(config),
): LyricWord[] {
	const ctx = context ?? { isQuoteOpen: false };
	if (config.engine === "none") {
		advanceContext(word.word, ctx);
		return [word];
	}
	if (word.word === "") return config.removeEmptySegments ? [] : [word];
	const tokens: string[] = [];
	let cursor = 0;
	if (pattern) {
		pattern.lastIndex = 0;
		for (const match of word.word.matchAll(pattern)) {
			tokens.push(
				...autoTokenize(word.word.slice(cursor, match.index), config),
			);
			tokens.push(...(configuredParts(match[0], config) ?? [match[0]]));
			cursor = match.index + match[0].length;
		}
	}
	tokens.push(...autoTokenize(word.word.slice(cursor), config));
	const parts = postProcess(tokens, config, ctx);
	if (!preservesSource(word.word, parts)) return [word];
	return distributeTime(
		word,
		parts,
		parts.map((part) => calculateWeight(part, config)),
	);
}

function advanceContext(text: string, context: SegmentationContext): void {
	for (const char of text) {
		if (PUNCT_AMBIGUOUS_QUOTES.has(char))
			context.isQuoteOpen = !context.isQuoteOpen;
	}
}

export function segmentLyricLines(
	lines: LyricLine[],
	config: SegmentationConfig,
	resetStatePerLine = true,
): LyricLine[] {
	const context: SegmentationContext = { isQuoteOpen: false };
	const pattern = prepareProtectedPattern(config);
	return lines.map((line) => {
		if (resetStatePerLine) context.isQuoteOpen = false;
		return {
			...line,
			words: line.words.flatMap((word) =>
				segmentWord(word, config, context, pattern),
			),
		};
	});
}

export function segmentSelectedWords(
	lines: LyricLine[],
	selectedWordIds: ReadonlySet<string>,
	config: SegmentationConfig,
): number {
	let count = 0;
	const pattern = prepareProtectedPattern(config);
	for (const line of lines) {
		if (!line.words.some((word) => selectedWordIds.has(word.id))) continue;
		const context: SegmentationContext = { isQuoteOpen: false };
		line.words = line.words.flatMap((word) => {
			if (!selectedWordIds.has(word.id)) {
				advanceContext(word.word, context);
				return [word];
			}
			const parts = segmentWord(word, config, context, pattern);
			if (parts.length > 1) count++;
			return parts;
		});
	}
	return count;
}

export function recalculateWordTime(
	originalWord: LyricWord,
	segments: string[],
	config: SegmentationConfig,
): LyricWord[] {
	return distributeTime(
		originalWord,
		segments,
		segments.map((token) => calculateWeight(token, config)),
	);
}
