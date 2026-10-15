import { afterEach, describe, expect, it, vi } from "vitest";
import { getLanguageName, getTranslationProgress } from "./language";

afterEach(() => vi.unstubAllGlobals());

describe("native language names", () => {
	it("capitalizes the native display name", () => {
		const of = vi.fn(() => "français");
		vi.stubGlobal("Intl", {
			DisplayNames: class {
				of = of;
			},
		});
		expect(getLanguageName("fr-FR")).toBe("Français");
		expect(of).toHaveBeenCalledWith("fr-FR");
	});

	it("uses the code when display names are unsupported", () => {
		vi.stubGlobal("Intl", {});
		expect(getLanguageName("zz-ZZ")).toBe("zz-ZZ");
	});

	it("uses the code when locale construction fails", () => {
		vi.stubGlobal("Intl", {
			DisplayNames: class {
				constructor() {
					throw new RangeError("Invalid locale");
				}
			},
		});
		expect(getLanguageName("invalid_locale")).toBe("invalid_locale");
	});

	it("falls back before capitalization when no name is returned", () => {
		vi.stubGlobal("Intl", {
			DisplayNames: class {
				of() {
					return undefined;
				}
			},
		});
		expect(getLanguageName("zz-ZZ")).toBe("Zz-ZZ");
	});
});

describe("translation progress", () => {
	const translations = {
		"en-US": {
			translation: {
				nested: { translated: "Hello", identical: "OK", empty: "Name" },
				missing: "Missing",
				other: "Other",
				blankInSource: "",
			},
		},
		fr: {
			translation: {
				nested: { translated: "Bonjour", identical: "OK", empty: "" },
				other: "Autre",
				blankInSource: "",
				extra: "Extra keys do not count",
			},
		},
	};

	it("counts translated and intentionally identical leaves, but not blank, missing or extra keys", () => {
		// translated, identical, other and blankInSource count; empty and missing do not.
		expect(getTranslationProgress("fr", translations)).toBe(66);
	});

	it("returns no progress for the source or unavailable translations", () => {
		expect(getTranslationProgress("en-US", translations)).toBeNull();
		expect(getTranslationProgress("de", translations)).toBeNull();
		expect(getTranslationProgress("fr", { fr: translations.fr })).toBeNull();
	});

	it("rounds percentages down", () => {
		expect(
			getTranslationProgress("fr", {
				"en-US": { translation: { a: "A", b: "B", c: "C" } },
				fr: { translation: { a: "Un" } },
			}),
		).toBe(33);
	});
});
