import { describe, expect, it } from "vitest";
import { getNoteFromFreq } from "./frequency-note";

describe("spectrogram note labels", () => {
	it.each([
		[0, ""],
		[20, ""],
		[21, "E0"],
		[440, "A4"],
		[880, "A5"],
		[261.625565, "C4"],
		[466.163762, "A#4"],
		[435, "A4"],
	])("labels %s Hz as %s", (frequency, label) => {
		expect(getNoteFromFreq(frequency)).toBe(label);
	});
});
