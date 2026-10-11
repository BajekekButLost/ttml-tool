import { describe, expect, it } from "vitest";
import { getTTMLSaveName } from "./ttml-save-name";

const lyric = {
	lyricLines: [],
	metadata: [
		{ key: "artists", value: ["Artist"] },
		{ key: "musicName", value: ["Title"] },
	],
};
describe("shared TTML naming policy", () => {
	it("keeps an explicit document name, but lets metadata replace the default", () => {
		expect(getTTMLSaveName(lyric, "Custom.ttml")).toBe("Custom.ttml");
		expect(getTTMLSaveName(lyric, "lyric.ttml")).toBe("Artist - Title.ttml");
	});
	it("respects a renamed project and reuses the existing sanitizer", () => {
		expect(
			getTTMLSaveName(lyric, "Old.ttml", {
				name: "New/Name",
				nameEdited: true,
			}),
		).toBe("New_Name.ttml");
	});
	it("falls back to project name, then lyric.ttml", () => {
		expect(
			getTTMLSaveName({ lyricLines: [], metadata: [] }, undefined, {
				name: "Project",
			}),
		).toBe("Project.ttml");
		expect(getTTMLSaveName({ lyricLines: [], metadata: [] })).toBe(
			"lyric.ttml",
		);
	});
});
