import type { LyricLine, LyricWordBase } from "$/types/ttml";

export interface DistributionOptions {
	weight?: "even" | "characters" | readonly number[];
	/** Spaces remain in the result with zero duration. */
	empty?: "zero" | "include";
}

/** Draft contiguous integer-ms times. Inputs are never mutated.
 * Custom weights let segmentation keep its syllable/punctuation policy.
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

/** Draft a line including zero-duration spaces, without mutating it. */
export function distributeLineTime(
	line: LyricLine,
	start: number,
	end: number,
	options: DistributionOptions = {},
): LyricLine {
	const times = distributeTime(line.words, start, end, options);
	const words = times;
	return {
		...line,
		words,
		startTime: times[0]?.startTime ?? line.startTime,
		endTime: times[times.length - 1]?.endTime ?? line.endTime,
	};
}
