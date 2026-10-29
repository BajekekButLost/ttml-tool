import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildLineRomanization,
	formatPhoneticForDisplay,
	getPhonetic,
	getPhoneticCapsules,
	getPhoneticSpans,
	getPhoneticSyllables,
} from "./phonetic";

const googleResponse = (romanized: string) =>
	new Response(JSON.stringify([[["", "", "", romanized]]]), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("phonetic conversion requests", () => {
	it("returns exact source offsets for spaces and supplementary characters", async () => {
		const spans = await getPhoneticSpans(" 你 𠀀好 ", "zh");
		expect(spans.map((span) => span.text).join("")).toBe(" 你 𠀀好 ");
		expect(spans.map((span) => span.text)).toEqual([
			" ",
			"你",
			" ",
			"𠀀",
			"好",
			" ",
		]);
		expect(spans.find((span) => span.text === "你")?.reading).toBe("nǐ");
		expect(spans.find((span) => span.text === "好")?.reading).toBe("hǎo");
		for (const span of spans)
			expect(" 你 𠀀好 ".slice(span.start, span.end)).toBe(span.text);
	});

	it("uses contextual local kana and Hangul readings without requests", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const spans = await getPhoneticSpans("キャット コーヒー", "ja");
		expect(spans.map((span) => span.text)).toEqual([
			"キャ",
			"ッ",
			"ト",
			" ",
			"コ",
			"ー",
			"ヒ",
			"ー",
		]);
		expect(spans.map((span) => span.reading).join("")).toBe("kyattokoohii");
		expect(
			(await getPhoneticSpans("한국어", "ko"))
				.map((span) => span.text)
				.join(""),
		).toBe("한국어");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("requests a compound reading once and flags unaligned source capsules", async () => {
		const fetchMock = vi.fn(async () => googleResponse("kyou"));
		vi.stubGlobal("fetch", fetchMock);
		const [first, second] = await Promise.all([
			getPhoneticSpans("今日", "ja"),
			getPhoneticSpans("今日", "ja"),
		]);
		expect(first).toEqual(second);
		expect(first).toEqual([
			{ text: "今日", start: 0, end: 2, reading: "kyou", warning: true },
		]);
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(await getPhoneticCapsules(["今", "日"], "ja")).toEqual([
			{ reading: "kyou", warning: true },
			{ reading: "", warning: true },
		]);
	});

	it("honors operation cancellation", async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			getPhoneticSpans("你好", "zh", controller.signal),
		).rejects.toMatchObject({ name: "AbortError" });
	});
	it("limits simultaneous Google transliteration requests", async () => {
		let activeRequests = 0;
		let maximumActiveRequests = 0;
		const fetchMock = vi.fn(async () => {
			activeRequests++;
			maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
			await new Promise((resolve) => setTimeout(resolve, 5));
			activeRequests--;
			return googleResponse("a");
		});
		vi.stubGlobal("fetch", fetchMock);

		await Promise.all(
			["一", "二", "三", "四", "五", "六", "七", "八"].map((text) =>
				getPhonetic(text, "ja"),
			),
		);

		expect(fetchMock).toHaveBeenCalledTimes(8);
		expect(maximumActiveRequests).toBeLessThanOrEqual(4);
	});

	it("retries Google after a temporary fallback", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error("offline"))
			.mockResolvedValueOnce(googleResponse("retry"));
		vi.stubGlobal("fetch", fetchMock);

		expect(await getPhonetic("重新嘗試獨特文字", "yue")).toBe("");
		expect(await getPhonetic("重新嘗試獨特文字", "yue")).toBe("retry");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("reuses successful Google results", async () => {
		const fetchMock = vi.fn(async () => googleResponse("Cached Value"));
		vi.stubGlobal("fetch", fetchMock);

		expect(await getPhonetic("成功快取獨特文字", "yue")).toBe("cachedvalue");
		expect(await getPhonetic("成功快取獨特文字", "yue")).toBe("cachedvalue");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("preserves contextual Chinese pinyin and tone marks", async () => {
		const fetchMock = vi.fn(async () => googleResponse("YĪN YUÈ YÍN HÁNG"));
		vi.stubGlobal("fetch", fetchMock);

		await expect(getPhoneticSyllables(["音乐", "银行"], "zh")).resolves.toEqual(
			["yīnyuè", "yínháng"],
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("formats displayed romanization as lowercase compact text", () => {
		expect(formatPhoneticForDisplay("Wǒ néng gòu fēi xiáng")).toBe(
			"wǒnénggòufēixiáng",
		);
	});

	it("leaves Latin capsules blank in mixed Chinese lines", async () => {
		const fetchMock = vi.fn(async (input: string | URL | Request) => {
			const query = new URL(String(input)).searchParams.get("q");
			return googleResponse(query === "中国" ? "Zhōng guó" : "I zhōng guó");
		});
		vi.stubGlobal("fetch", fetchMock);

		await expect(getPhoneticSyllables(["I", "中国"], "zh")).resolves.toEqual([
			"",
			"zhōngguó",
		]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("preserves source spacing and Latin text in line romanization", () => {
		expect(
			buildLineRomanization(
				["I", " ", "told", " ", "you,", " ", "it's", " ", "中", "国"],
				["", "", "", "", "", "", "", "", "zhōng", "guó"],
			),
		).toBe("i told you, it's zhōngguó");
	});
});
