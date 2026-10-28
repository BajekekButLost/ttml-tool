import { describe, expect, it } from "vitest";
import {
	clampPlaybackRate,
	PLAYBACK_RATE_SLIDER_STEPS,
	playbackRateToSliderPosition,
	sliderPositionToPlaybackRate,
	stepPlaybackRate,
} from "./playback-rate";

describe("speed slider scale", () => {
	it("puts 1x in the middle and the limits at the ends", () => {
		expect(playbackRateToSliderPosition(1)).toBe(
			PLAYBACK_RATE_SLIDER_STEPS / 2,
		);
		expect(sliderPositionToPlaybackRate(0)).toBe(0.1);
		expect(sliderPositionToPlaybackRate(PLAYBACK_RATE_SLIDER_STEPS / 2)).toBe(
			1,
		);
		expect(sliderPositionToPlaybackRate(PLAYBACK_RATE_SLIDER_STEPS)).toBe(2);
	});
	it("round-trips the speed presets", () => {
		for (const rate of [0.5, 0.75, 1, 1.25, 2]) {
			expect(
				sliderPositionToPlaybackRate(playbackRateToSliderPosition(rate)),
			).toBe(rate);
		}
	});
});

describe("playback speed bounds", () => {
	it("clamps shortcut steps to the same 0.1-2x range as sliders", () => {
		expect(stepPlaybackRate(1.9, 1)).toBe(2);
		expect(stepPlaybackRate(0.25, -1)).toBe(0.1);
		expect(stepPlaybackRate(2, 1)).toBe(2);
		expect(stepPlaybackRate(0.1, -1)).toBe(0.1);
	});
	it("keeps quarter steps precise from non-quarter slider values", () => {
		expect(stepPlaybackRate(0.1, 1)).toBe(0.35);
		expect(stepPlaybackRate(1.05, -1)).toBe(0.8);
	});
	it("normalizes old saved speeds and invalid values", () => {
		expect(clampPlaybackRate(4)).toBe(2);
		expect(clampPlaybackRate(0)).toBe(0.1);
		expect(clampPlaybackRate(Number.NaN)).toBe(1);
	});
});
