import type { LyricLine, LyricWordBase } from "$/types/ttml";

export interface DistributionOptions {
	weight?: "even" | "characters" | readonly number[];
	/** Spaces remain in the result with zero duration. */
	empty?: "zero" | "include";
}

/** Draft contiguous integer-ms times. Inputs are never mutated.
 * Custom weights let segmentation keep its syllable/punctuation policy.
 * Callers flatten ruby sub-units before distributing, then update their parent.
 */
export function distributeTime<T extends LyricWordBase>(
	units: readonly T[],
	start: number,
	end: number,
	{ weight = "even", empty = "zero" }: DistributionOptions = {},
): T[] {
	const startTime = Number.isFinite(start) ? Math.max(0, Math.round(start)) : 0;
	const endTime = Number.isFinite(end)
		? Math.max(startTime, Math.round(end))
		: startTime;
	const weights = units.map((unit, index) => {
		if (empty === "zero" && !unit.word.trim()) return 0;
		const value =
			typeof weight === "string"
				? weight === "even"
					? 1
					: Math.max(1, unit.word.trim().length)
				: weight[index];
		return Number.isFinite(value) && value > 0 ? value : 0;
	});
	let total = weights.reduce((sum, value) => sum + value, 0);
	// Never delete punctuation-only/zero-weight segments. Fall back to even
	// allocation among included units when no positive weight is available.
	if (total === 0) {
		units.forEach((unit, index) => {
			weights[index] = empty === "include" || unit.word.trim() ? 1 : 0;
		});
		total = weights.reduce((sum, value) => sum + value, 0);
	}
	let cumulative = 0;
	let cursor = startTime;
	return units.map((unit, index) => {
		cumulative += weights[index];
		const next =
			total > 0
				? Math.min(
						endTime,
						Math.max(
							cursor,
							Math.round(
								startTime + ((endTime - startTime) * cumulative) / total,
							),
						),
					)
				: startTime;
		const result = { ...unit, startTime: cursor, endTime: next };
		cursor = next;
		return result;
	});
}

/** Draft a line using ruby reading units, including zero-duration spaces.
 * Updating parents from the complete reading avoids stale empty ruby times
 * pulling an otherwise timed parent back to zero.
 */
export function distributeLineTime(
	line: LyricLine,
	start: number,
	end: number,
	options: DistributionOptions = {},
): LyricLine {
	const units = line.words.flatMap((word) =>
		word.ruby?.length ? word.ruby : [word],
	);
	const times = distributeTime(units, start, end, options);
	let index = 0;
	const words = line.words.map((word) => {
		if (word.ruby?.length) {
			const ruby = times.slice(index, index + word.ruby.length);
			index += ruby.length;
			return {
				...word,
				ruby,
				startTime: ruby[0].startTime,
				endTime: ruby[ruby.length - 1].endTime,
			};
		}
		const timing = times[index++];
		return { ...word, startTime: timing.startTime, endTime: timing.endTime };
	});
	return {
		...line,
		words,
		startTime: times[0]?.startTime ?? line.startTime,
		endTime: times[times.length - 1]?.endTime ?? line.endTime,
	};
}
