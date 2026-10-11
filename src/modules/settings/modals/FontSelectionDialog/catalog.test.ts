import { describe, expect, it } from "vitest";
import { GOOGLE_FONTS, SYSTEM_FONTS } from "./catalog";

describe("font catalog", () => {
	it.each([
		["Google", GOOGLE_FONTS],
		["system", SYSTEM_FONTS],
	])("lists each %s font once, since font cards are keyed by name", (_, fonts) => {
		expect(new Set(fonts).size).toBe(fonts.length);
	});
});
