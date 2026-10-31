export function getLatencyStatistics(samples: number[], appliedOffset: number) {
	if (samples.length === 0) return null;
	const sorted = [...samples].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0
			? (sorted[middle - 1] + sorted[middle]) / 2
			: sorted[middle];
	return {
		count: samples.length,
		meanAbsoluteError: Math.round(
			(samples.reduce((total, value) => total + Math.abs(value), 0) /
				samples.length) *
				1000,
		),
		recommendedOffset:
			samples.length >= 20 ? Math.round(median * 1000 + appliedOffset) : null,
	};
}

export function subscribeLatencyTestTaps<Event>(
	active: boolean,
	subscribe: (callback: (event: Event) => void) => () => void,
	onTap: (event: Event) => void,
): (() => void) | undefined {
	if (!active) return;
	let closed = false;
	const unsubscribe = subscribe((event) => {
		if (!closed) onTap(event);
	});
	return () => {
		closed = true;
		unsubscribe();
	};
}
