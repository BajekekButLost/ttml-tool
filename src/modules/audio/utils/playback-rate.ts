export const MIN_PLAYBACK_RATE = 0.1;
export const MAX_PLAYBACK_RATE = 2;

export function clampPlaybackRate(value: number): number {
	return Number.isFinite(value)
		? Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, value))
		: 1;
}

export function stepPlaybackRate(value: number, direction: 1 | -1): number {
	return clampPlaybackRate(Math.round((value + direction * 0.25) * 100) / 100);
}

/** Positions on the speed slider. 1x sits in the middle, at half of this. */
export const PLAYBACK_RATE_SLIDER_STEPS = 40;
const HALF = PLAYBACK_RATE_SLIDER_STEPS / 2;

/** Slider position to speed: the left half covers 0.1-1x, the right half 1-2x. */
export function sliderPositionToPlaybackRate(position: number): number {
	const rate =
		position <= HALF
			? MIN_PLAYBACK_RATE + (position / HALF) * (1 - MIN_PLAYBACK_RATE)
			: 1 + ((position - HALF) / HALF) * (MAX_PLAYBACK_RATE - 1);
	return clampPlaybackRate(Math.round(rate * 100) / 100);
}

export function playbackRateToSliderPosition(rate: number): number {
	const clamped = clampPlaybackRate(rate);
	return clamped <= 1
		? ((clamped - MIN_PLAYBACK_RATE) / (1 - MIN_PLAYBACK_RATE)) * HALF
		: HALF + ((clamped - 1) / (MAX_PLAYBACK_RATE - 1)) * HALF;
}
