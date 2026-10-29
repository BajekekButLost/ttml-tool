type Segmenter = { segment(text: string): Iterable<{ segment: string }> };

const SegmenterConstructor = (
	Intl as typeof Intl & {
		Segmenter?: new (
			locale?: string,
			options?: { granularity: "grapheme" },
		) => Segmenter;
	}
).Segmenter;
const segmenter = SegmenterConstructor
	? new SegmenterConstructor(undefined, { granularity: "grapheme" })
	: undefined;

export function graphemes(text: string): string[] {
	if (segmenter)
		return Array.from(segmenter.segment(text), (part) => part.segment);
	const result: string[] = [];
	let regionalCount = 0;
	for (const char of text) {
		const previous = result[result.length - 1];
		const regional = /\p{Regional_Indicator}/u.test(char);
		const attach =
			previous !== undefined &&
			(/\p{M}|\p{Emoji_Modifier}|[\ufe00-\ufe0f]|\uff9e|\uff9f/u.test(char) ||
				char === "\u200d" ||
				previous.endsWith("\u200d") ||
				(regional && regionalCount % 2 === 1) ||
				(previous === "\r" && char === "\n") ||
				(/[\u1100-\u11ff\ua960-\ua97f\ud7b0-\ud7ff]/u.test(char) &&
					/[\p{Script=Hangul}]$/u.test(previous)));
		if (attach) result[result.length - 1] += char;
		else result.push(char);
		regionalCount = regional ? regionalCount + 1 : 0;
	}
	return result;
}

export function graphemeOffsets(text: string): number[] {
	const offsets = [0];
	for (const char of graphemes(text)) {
		offsets.push(offsets[offsets.length - 1] + char.length);
	}
	return offsets;
}

export function preservesSource(
	text: string,
	parts: readonly string[],
): boolean {
	if (parts.join("") !== text || (text !== "" && parts.length === 0))
		return false;
	const offsets = new Set(graphemeOffsets(text));
	let offset = 0;
	return parts.every((part) => {
		offset += part.length;
		return offsets.has(offset);
	});
}

export function mapSourceSlices(
	text: string,
	parts: readonly string[],
	normalize = (value: string) => value.normalize("NFC").toLowerCase(),
): string[] | null {
	if (!parts.length || parts.some((part) => !part)) return null;
	const source = graphemes(text);
	const result: string[] = [];
	let cursor = 0;
	for (const part of parts) {
		const start = cursor;
		let candidate = "";
		while (
			cursor < source.length &&
			candidate.length < normalize(part).length
		) {
			candidate += normalize(source[cursor++]);
		}
		if (candidate !== normalize(part)) return null;
		result.push(source.slice(start, cursor).join(""));
	}
	return cursor === source.length ? result : null;
}
