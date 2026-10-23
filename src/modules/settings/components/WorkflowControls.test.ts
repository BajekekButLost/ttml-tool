import { describe, expect, it, vi } from "vitest";

vi.mock("$/modules/audio/audio-engine", () => ({ audioEngine: {} }));

import { parseSyncOffset } from "./WorkflowControls";

describe("shared workflow setting behavior", () => {
	it.each([
		["", 0],
		["invalid", 0],
		["Infinity", 0],
		["-123", -123],
		["12.9", 12],
		["1.2e3", 1],
	])("parses %s as the same whole-ms offset in both controls", (input, expected) => {
		expect(parseSyncOffset(input)).toBe(expected);
	});
});
