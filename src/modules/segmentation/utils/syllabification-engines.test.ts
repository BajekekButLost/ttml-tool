import i18next from "i18next";
import ICU from "i18next-icu";
import { createStore, Provider } from "jotai";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import en from "$/i18n/locales/en-US/translation.json";
import { newLyricWord } from "$/types/ttml";
import { ManualWordSplitter } from "../components/ManualWordSplitter";
import {
	segmentationEngineAtom,
	segmentationSplitEnglishAtom,
} from "../states";
import type { SegmentationConfig, SegmentationEngineId } from "../types";
import * as hyphenLoader from "./hyphen-loader";
import { loadHyphenator } from "./hyphen-loader";
import { segmentWord } from "./segmentation";
import {
	getSyllabificationEngine,
	splitJapaneseText,
} from "./syllabification-engines";
import { useSegmentationConfig } from "./useSegmentationConfig";

const prosodicConfig: SegmentationConfig = {
	engine: "prosodic",
	splitCJK: true,
	splitEnglish: true,
	punctuationWeight: 0.2,
	punctuationMode: "merge",
	removeEmptySegments: true,
	ignoreList: new Set(),
	customRules: new Map(),
	learnedRules: new Map(),
};

describe("syllabification engines", () => {
	it("rejects missing and mismatched pattern configurations", () => {
		const word = { ...newLyricWord(), word: "przepraszam" };
		expect(() =>
			segmentWord(word, { ...prosodicConfig, engine: "hyphenation-pl" }),
		).toThrow("not ready");
		expect(() =>
			segmentWord(word, {
				...prosodicConfig,
				engine: "hyphenation-pl",
				hyphenator: (value) => value,
				hyphenatorEngine: "hyphenation-de",
			}),
		).toThrow("not ready");
	});

	it("deduplicates in-flight pattern imports", async () => {
		const first = loadHyphenator("es");
		const second = loadHyphenator("es");
		expect(first).toBe(second);
		expect(await first).toBeTypeOf("function");
	});

	it("resolves the local engine and clears stale loading and failures", async () => {
		const { JSDOM } = await import("jsdom" as string);
		const dom = new JSDOM("<div id='root'></div>", {
			url: "https://ttml.test",
		});
		vi.stubGlobal("window", dom.window);
		vi.stubGlobal("document", dom.window.document);
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		const store = createStore();
		const i18n = i18next.createInstance();
		await i18n
			.use(ICU)
			.init({ lng: "en-US", resources: { "en-US": { translation: en } } });
		store.set(segmentationEngineAtom, "prosodic");
		let override: SegmentationEngineId = "hyphenation-pl";
		let current: ReturnType<typeof useSegmentationConfig> | undefined;
		let finish:
			| ((value: ((text: string) => string) | null) => void)
			| undefined;
		vi.spyOn(hyphenLoader, "loadHyphenator").mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		const Capture = () => {
			current = useSegmentationConfig(override);
			return null;
		};
		const root = createRoot(
			dom.window.document.getElementById("root") as HTMLElement,
		);
		const render = () =>
			root.render(
				createElement(
					I18nextProvider,
					{ i18n },
					createElement(Provider, { store }, createElement(Capture)),
				),
			);
		try {
			await act(async () => render());
			expect(current?.config.engine).toBe("hyphenation-pl");
			expect(current?.isReady).toBe(false);
			const polish = (text: string) => text;
			await act(async () => finish?.(polish));
			expect(current?.config.hyphenator).toBe(polish);
			expect(current?.config.hyphenatorEngine).toBe("hyphenation-pl");
			override = "hyphenation-de";
			await act(async () => render());
			expect(current?.config.hyphenator).toBeUndefined();
			expect(current?.isLoading).toBe(true);
			const staleFinish = finish;
			await act(async () => store.set(segmentationSplitEnglishAtom, false));
			expect(current?.isLoading).toBe(false);
			expect(current?.isReady).toBe(true);
			await act(async () => staleFinish?.(polish));
			expect(current?.config.hyphenator).toBeUndefined();
			await act(async () => store.set(segmentationSplitEnglishAtom, true));
			await act(async () => finish?.(null));
			expect(current?.isReady).toBe(false);
			expect(current?.error).toBe(true);
		} finally {
			await act(async () => root.unmount());
			vi.restoreAllMocks();
			vi.unstubAllGlobals();
			dom.window.close();
		}
	});

	it("names complete-character boundaries and exposes their toggled state", async () => {
		const { JSDOM } = await import("jsdom" as string);
		const dom = new JSDOM("<div id='root'></div>", {
			url: "https://ttml.test",
		});
		vi.stubGlobal("window", dom.window);
		vi.stubGlobal("document", dom.window.document);
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		const i18n = i18next.createInstance();
		await i18n
			.use(ICU)
			.init({ lng: "en-US", resources: { "en-US": { translation: en } } });
		const toggle = vi.fn();
		const root = createRoot(
			dom.window.document.getElementById("root") as HTMLElement,
		);
		try {
			await act(async () =>
				root.render(
					createElement(
						I18nextProvider,
						{ i18n },
						createElement(ManualWordSplitter, {
							word: "a\u0301👨‍👩‍👧‍👦𠀀",
							splitIndices: new Set([1]),
							onSplitIndexToggle: toggle,
						}),
					),
				),
			);
			const buttons = dom.window.document.querySelectorAll("button");
			expect(buttons).toHaveLength(2);
			expect(buttons[0].getAttribute("aria-label")).toBe(
				"Split between a\u0301 and 👨‍👩‍👧‍👦",
			);
			expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
			expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
			buttons[1].focus();
			expect(dom.window.document.activeElement).toBe(buttons[1]);
			await act(async () => buttons[1].click());
			expect(toggle).toHaveBeenCalledWith(2);
		} finally {
			await act(async () => root.unmount());
			vi.unstubAllGlobals();
			dom.window.close();
		}
	});
	it.each([
		"PAYS",
		"привет",
		"Україна",
		"Αθήνα",
		"éé",
		"œœ",
	])("preserves French adapter input %s", (word) => {
		expect(getSyllabificationEngine("syllabify-fr").split(word).join("")).toBe(
			word,
		);
	});

	it.each([
		"y’all",
		"could’ve",
		"we’re",
	])("keeps reviewed contraction %s", (word) => {
		expect(getSyllabificationEngine("prosodic").split(word)).toEqual([word]);
	});

	it.each([
		"singin'",
		"SINGIN’",
	])("recognizes elided dropped-g spelling %s", (word) => {
		expect(getSyllabificationEngine("prosodic").split(word)).toEqual([
			word.slice(0, 4),
			word.slice(4),
		]);
	});

	it("honors Japanese shared settings and kana combinations", () => {
		const split = (word: string, settings: Partial<SegmentationConfig> = {}) =>
			segmentWord(
				{ ...newLyricWord(), word },
				{ ...prosodicConfig, engine: "japanese", ...settings },
			).map((part) => part.word);
		expect(split("ファイル")).toEqual(["ファ", "イ", "ル"]);
		expect(split("ｷｬｯﾄ")).toEqual(["ｷｬ", "ｯ", "ﾄ"]);
		expect(split("ぱんパン")).toEqual(["ぱ", "ん", "パ", "ン"]);
		expect(split("キャット。", { punctuationMode: "standalone" })).toEqual([
			"キャ",
			"ッ",
			"ト",
			"。",
		]);
		expect(split("キャット", { splitCJK: false })).toEqual(["キャット"]);
		expect(split("we’re")).toEqual(["we’re"]);
	});
	it("uses Prosodic dictionary entries before its speech fallback", () => {
		const parts = getSyllabificationEngine("prosodic").split("everything");
		expect(parts.join("")).toBe("everything");
		expect(parts.length).toBeGreaterThan(1);
	});

	it("handles dropped-g lyric spellings", () => {
		const parts = getSyllabificationEngine("prosodic").split("singin");
		expect(parts.join("")).toBe("singin");
		expect(parts.length).toBeGreaterThan(1);
	});

	it("keeps contractions with typographic apostrophes together", () => {
		for (const contraction of ["we’re", "you’ve", "they’re"]) {
			const word = { ...newLyricWord(), word: contraction };
			expect(
				segmentWord(word, prosodicConfig).map((part) => part.word),
			).toEqual([contraction]);
		}
	});

	it("keeps basic and none engines unsplit", () => {
		expect(getSyllabificationEngine("basic").split("beautiful")).toEqual([
			"beautiful",
		]);
		expect(getSyllabificationEngine("none").split("beautiful")).toEqual([
			"beautiful",
		]);
	});

	it("keeps Japanese modifiers and punctuation with their mora", () => {
		expect(splitJapaneseText("キャット。")).toEqual(["キャ", "ッ", "ト。"]);
	});

	it.each([
		["silabas", "corazón"],
		["syllabify-fr", "bonjour"],
		["syllabify", "привет"],
	] as const)("preserves text with the %s engine", (engine, word) => {
		const parts = getSyllabificationEngine(engine).split(word);
		expect(parts.join("")).toBe(word);
	});

	it("loads Polish hyphenation patterns", async () => {
		const hyphenate = await loadHyphenator("pl");
		expect(hyphenate?.("przepraszam").split("\u00ad")).toEqual([
			"prze",
			"pra",
			"szam",
		]);
	});
});
