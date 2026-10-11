import { describe, expect, it } from "vitest";
import { getCoverPalette } from "./cover-palette";

describe("Spicy cover palette", () => {
	it("does not choose invisible pixels for the highlight", () => {
		expect(
			getCoverPalette(
				new Uint8ClampedArray([100, 100, 100, 255, 200, 0, 0, 0]),
			),
		).toEqual({ base: "#646464", highlight: "#646464" });
	});
	it("ignores images with no weighted pixels", () => {
		expect(getCoverPalette(new Uint8ClampedArray())).toBeUndefined();
		expect(
			getCoverPalette(new Uint8ClampedArray([200, 0, 0, 0])),
		).toBeUndefined();
	});
	it("uses the base color when no pixel qualifies for a highlight", () => {
		expect(
			getCoverPalette(new Uint8ClampedArray([255, 255, 255, 255])),
		).toEqual({ base: "#ffffff", highlight: "#ffffff" });
	});
	it("weights base colors by alpha/saturation and chooses the most saturated highlight", () => {
		expect(
			getCoverPalette(new Uint8ClampedArray([200, 0, 0, 255, 0, 100, 0, 255])),
		).toEqual({ base: "#643200", highlight: "#c80000" });
	});
});
