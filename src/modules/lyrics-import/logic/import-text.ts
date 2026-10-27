import {
	createSectionFromHeader,
	getSectionHeader,
	normalizeSectionHeader,
} from "$/modules/lyric-editor/utils/section-system";
import { textToLines } from "$/modules/project/logic/text-to-lines";
import type {
	LyricLine,
	LyricSection,
	LyricSectionCategory,
} from "$/types/ttml";

export type ImportContentMode =
	| "lyric"
	| "lyric-trans"
	| "lyric-roman"
	| "lyric-trans-roman";

export type ImportLineSeparatorMode =
	| "interleaved-line"
	| "same-line-separator";

/** How the import text area is read. Every source goes through this. */
export interface ImportTextFormat {
	mode: ImportContentMode;
	lineSeparatorMode: ImportLineSeparatorMode;
	lineSeparator: string;
	swapTransAndRoman: boolean;
	wordSeparator: string;
	enableSpecialPrefix: boolean;
	bgLyricPrefix: string;
	duetLyricPrefix: string;
}

export const DEFAULT_IMPORT_TEXT_FORMAT: ImportTextFormat = {
	mode: "lyric",
	lineSeparatorMode: "interleaved-line",
	lineSeparator: "|",
	swapTransAndRoman: false,
	wordSeparator: "\\",
	enableSpecialPrefix: true,
	bgLyricPrefix: "<",
	duetLyricPrefix: ">",
};

/**
 * Parse the import text into untimed lines. Blank rows are dropped, and
 * `[Header]` rows become sections or are dropped.
 */
export function importTextToLines(
	text: string,
	format: ImportTextFormat,
	makeSections: boolean,
): LyricLine[] {
	return textToLines(text, {
		mode: format.mode,
		lineSeparatorMode: format.lineSeparatorMode,
		lineSeparator: format.lineSeparator,
		swapTransAndRoman: format.swapTransAndRoman,
		wordSeparator: format.wordSeparator,
		sectionHeaders: makeSections ? "categorize" : "discard",
		blankLines: "discard",
		backgroundPrefix: format.enableSpecialPrefix ? format.bgLyricPrefix : "",
		duetPrefix: format.enableSpecialPrefix ? format.duetLyricPrefix : "",
	});
}

export type ImportRowKind =
	| "lyric"
	| "background"
	| "duet"
	| "translation"
	| "romanization"
	| "section"
	| "removedHeader"
	| "blank";

export interface ImportRow {
	kind: ImportRowKind;
	category?: LyricSectionCategory;
}

/**
 * What each row of the import text turns into, one entry per row, read the
 * same way as {@link importTextToLines}. Drives the gutter beside the text.
 */
export function classifyImportRows(
	text: string,
	format: ImportTextFormat,
	makeSections: boolean,
): ImportRow[] {
	const rows = text.split(/\r\n|\r|\n/);
	const subKinds: ImportRowKind[] =
		format.lineSeparatorMode === "same-line-separator"
			? []
			: format.mode === "lyric-trans-roman"
				? ["translation", "romanization"]
				: format.mode === "lyric-trans"
					? ["translation"]
					: format.mode === "lyric-roman"
						? ["romanization"]
						: [];
	if (format.swapTransAndRoman) subKinds.reverse();
	const bg = format.enableSpecialPrefix ? format.bgLyricPrefix : "";
	const duet = format.enableSpecialPrefix ? format.duetLyricPrefix : "";

	const result: ImportRow[] = [];
	for (let index = 0; index < rows.length; ) {
		const main = rows[index++].trim();
		const header = makeSections
			? getSectionHeader(main)
			: /^\[.*\]$/.test(main)
				? main
				: undefined;
		if (header) {
			result.push(
				makeSections
					? {
							kind: "section",
							category: normalizeSectionHeader(header)?.category,
						}
					: { kind: "removedHeader" },
			);
			continue;
		}
		const subs = subKinds.slice(0, rows.length - index);
		index += subs.length;
		if (!main) {
			result.push(
				{ kind: "blank" },
				...subs.map(() => ({ kind: "blank" as const })),
			);
			continue;
		}
		const kind: ImportRowKind =
			bg && main.startsWith(bg)
				? "background"
				: duet && main.startsWith(duet)
					? "duet"
					: "lyric";
		result.push({ kind }, ...subs.map((sub) => ({ kind: sub })));
	}
	return result;
}

export interface ReviewedSection extends LyricSection {
	occurrence: number;
	lineCount: number;
	/** First lyric row under the header, to recognise the section by. */
	firstLine?: string;
}

export const hasSectionHeaders = (text: string) =>
	text.split(/\r\n|\r|\n/).some((line) => !!getSectionHeader(line));

/** The sections the import would create, in order, for the review step. */
export function detectSections(text: string): ReviewedSection[] {
	const result: ReviewedSection[] = [];
	let current: ReviewedSection | undefined;
	let occurrence = 0;
	for (const rawLine of text.split(/\r\n|\r|\n/)) {
		const header = getSectionHeader(rawLine);
		if (header) {
			const section = createSectionFromHeader(header);
			if (section) {
				current = { ...section, occurrence: occurrence++, lineCount: 0 };
				result.push(current);
			}
		} else if (rawLine.trim() && current) {
			current.lineCount++;
			current.firstLine ??= rawLine.trim();
		}
	}
	return result;
}

/**
 * Keep the user's edits to sections that still exist after the text changed,
 * matching by position first and then by label.
 */
export function mergeReviewedSections(
	previous: ReviewedSection[],
	detected: ReviewedSection[],
): ReviewedSection[] {
	return detected.map((next) => {
		const match =
			previous.find(
				(section) =>
					section.occurrence === next.occurrence &&
					section.label === next.label,
			) ?? previous.find((section) => section.label === next.label);
		return match
			? {
					...next,
					category: match.category,
					ordinal: match.ordinal,
					confidence: match.confidence,
				}
			: next;
	});
}

/** Drop review-only fields so they don't end up stored on the sections. */
export const toSectionOverrides = (reviewed: ReviewedSection[]) =>
	reviewed.map(({ firstLine: _firstLine, ...section }) => section);

/**
 * Insert syllable split marks into the import text, leaving headers, blank
 * rows, prefixes, translation rows and spacing as they are. Each run of
 * non-space text between word separators goes through `splitWord`; spaces
 * become their own words, the same as Process lyrics writes them.
 */
export function segmentImportText(
	text: string,
	format: ImportTextFormat,
	splitWord: (word: string) => string[],
): string {
	const separator = format.wordSeparator;
	if (!separator) return text;
	const subRowCount =
		format.lineSeparatorMode === "same-line-separator"
			? 0
			: format.mode === "lyric-trans-roman"
				? 2
				: format.mode === "lyric"
					? 0
					: 1;
	const sameLine =
		format.mode !== "lyric" &&
		format.lineSeparatorMode === "same-line-separator" &&
		!!format.lineSeparator;
	const prefixes = format.enableSpecialPrefix
		? [format.bgLyricPrefix, format.duetLyricPrefix].filter(Boolean)
		: [];

	const splitChunk = (chunk: string) => {
		const parts = splitWord(chunk).filter((part) => part.length > 0);
		// Never let a split change the text itself.
		return parts.join("") === chunk ? parts : [chunk];
	};
	const splitBody = (body: string) =>
		body
			.split(separator)
			.flatMap((piece) =>
				piece
					.split(/(\s+)/)
					.filter((chunk) => chunk.length > 0)
					.flatMap((chunk) =>
						/^\s+$/.test(chunk) ? [chunk] : splitChunk(chunk),
					),
			)
			.join(separator);

	const rows = text.split(/\r\n|\r|\n/);
	const output: string[] = [];
	for (let index = 0; index < rows.length; ) {
		const row = rows[index++];
		if (getSectionHeader(row)) {
			output.push(row);
			continue;
		}
		const subRows = rows.slice(index, index + subRowCount);
		index += subRowCount;
		if (!row.trim()) {
			output.push(row, ...subRows);
			continue;
		}
		const cut = sameLine ? row.indexOf(format.lineSeparator) : -1;
		const main = cut >= 0 ? row.slice(0, cut) : row;
		const rest = cut >= 0 ? row.slice(cut) : "";
		const lead = main.match(/^\s*/)?.[0] ?? "";
		let body = main.slice(lead.length);
		let prefix = "";
		for (let found = true; found; ) {
			found = false;
			for (const marker of prefixes) {
				if (body.startsWith(marker)) {
					prefix += marker;
					body = body.slice(marker.length);
					found = true;
				}
			}
		}
		const trail = body.match(/\s*$/)?.[0] ?? "";
		body = body.slice(0, body.length - trail.length);
		output.push(lead + prefix + splitBody(body) + trail + rest, ...subRows);
	}
	return output.join("\n");
}
