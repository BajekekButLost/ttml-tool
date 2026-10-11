// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const testEngine = vi.hoisted(() =>
	Object.assign(new EventTarget(), {
		interpolatedCurrentTime: 0,
		musicPlaying: false,
		seekMusic: vi.fn(),
	}),
);
vi.mock("$/modules/audio/audio-engine", () => ({ audioEngine: testEngine }));
vi.mock("$/modules/audio/states", async () => {
	const { atom } = await import("jotai");
	return { audioCoverArtAtom: atom(null), currentTimeAtom: atom(0) };
});
vi.mock("$/states/store", async () => {
	const { createStore } = await import("jotai");
	return { globalStore: createStore() };
});
vi.mock("$/components/PreviewModeSwitcher/states", async () => {
	const { lyricLinesAtom } = await import("$/states/main");
	return { timedPreviewLyricsAtom: lyricLinesAtom };
});
vi.mock("$/modules/settings/modals/customBackground", async () => {
	const { atom } = await import("jotai");
	return { customBackgroundImageAtom: atom(null) };
});
vi.mock("$/modules/settings/states", async () => {
	const { atom } = await import("jotai");
	return {
		useCustomAccentAtom: atom(false),
		customAccentColorAtom: atom("#fff"),
	};
});
vi.mock("$/modules/settings/states/preview", async () => {
	const { atom } = await import("jotai");
	return {
		showFpsCounterAtom: atom(false),
		showRomanLinesAtom: atom(false),
		showTranslationLinesAtom: atom(false),
		spicyBackgroundModeAtom: atom("static"),
		spicyForceLineSyncedAtom: atom(false),
		spicySimpleLyricsModeAtom: atom(false),
	};
});

import { Provider } from "jotai";
import { currentTimeAtom } from "$/modules/audio/states";
import { playbackClock } from "$/modules/playback-clock";
import { spicySimpleLyricsModeAtom } from "$/modules/settings/states/preview";
import { lyricLinesAtom } from "$/states/main";
import { globalStore } from "$/states/store";
import { newLyricLine, newLyricWord } from "$/types/ttml";
import { SpicyLyrics } from ".";

const originalAnimate = Object.getOwnPropertyDescriptor(
	HTMLElement.prototype,
	"animate",
);
const originalScrollTo = Object.getOwnPropertyDescriptor(
	HTMLElement.prototype,
	"scrollTo",
);

afterEach(() => {
	testEngine.musicPlaying = false;
	testEngine.dispatchEvent(new Event("music-pause"));
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	if (originalAnimate)
		Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
	else Reflect.deleteProperty(HTMLElement.prototype, "animate");
	if (originalScrollTo)
		Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
	else Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

describe("Spicy shared-clock rendering", () => {
	it.each([
		false,
		true,
	])("uses the editor position through pause, seek and rate changes (simple=%s)", async (simple) => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		const frames = new Map<number, FrameRequestCallback>();
		let frameId = 0;
		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
			frames.set(++frameId, callback);
			return frameId;
		});
		vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
		vi.stubGlobal("scrollTo", vi.fn());
		HTMLElement.prototype.scrollTo = vi.fn();
		const animations: Array<{
			currentTime: number | null;
			pause: ReturnType<typeof vi.fn>;
			cancel: ReturnType<typeof vi.fn>;
		}> = [];
		Object.defineProperty(HTMLElement.prototype, "animate", {
			configurable: true,
			value: vi.fn(() => {
				const animation = { currentTime: 0, pause: vi.fn(), cancel: vi.fn() };
				animations.push(animation);
				return animation;
			}),
		});
		const word = {
			...newLyricWord(),
			word: "Hi",
			startTime: 1000,
			endTime: 2000,
		};
		globalStore.set(lyricLinesAtom, {
			lyricLines: [
				{ ...newLyricLine(), startTime: 1000, endTime: 2000, words: [word] },
			],
			metadata: [],
		});
		globalStore.set(spicySimpleLyricsModeAtom, simple);
		testEngine.interpolatedCurrentTime = 0.95;
		testEngine.dispatchEvent(new Event("music-seeked"));
		const container = document.createElement("div");
		const root = createRoot(container);
		try {
			await act(async () =>
				root.render(
					<Provider store={globalStore}>
						<SpicyLyrics />
					</Provider>,
				),
			);
			const line = container.querySelector("[data-state]");
			expect(line?.getAttribute("data-state")).toBe("not-sung");
			// At 950ms, the former +100ms playing lead marked this line active.
			await act(async () => {
				testEngine.musicPlaying = true;
				testEngine.dispatchEvent(new Event("music-resume"));
			});
			expect(line?.getAttribute("data-state")).toBe("not-sung");
			expect(frames.size).toBe(1);
			await act(async () => {
				testEngine.interpolatedCurrentTime = 1.5;
				const callbacks = [...frames.values()];
				frames.clear();
				for (const callback of callbacks) callback(16);
			});
			expect(globalStore.get(currentTimeAtom)).toBe(1500);
			expect(playbackClock.getSnapshot()).toBe(1.5);
			expect(line?.getAttribute("data-state")).toBe("active");
			if (simple) {
				expect(animations[animations.length - 1]?.currentTime).toBe(500);
				expect(animations[animations.length - 1]?.pause).toHaveBeenCalled();
			}
			await act(async () => {
				testEngine.musicPlaying = false;
				testEngine.dispatchEvent(new Event("music-pause"));
			});
			expect(frames.size).toBe(0);
			await act(async () => {
				testEngine.interpolatedCurrentTime = 1.75;
				testEngine.dispatchEvent(new Event("music-seeked"));
			});
			expect(globalStore.get(currentTimeAtom)).toBe(1750);
			if (simple)
				expect(animations[animations.length - 1]?.currentTime).toBe(750);
			expect(frames.size).toBe(0);
			await act(async () => {
				testEngine.musicPlaying = true;
				testEngine.dispatchEvent(new Event("music-resume"));
				testEngine.dispatchEvent(new Event("music-playback-rate-change"));
				testEngine.interpolatedCurrentTime = 1.8;
				const callbacks = [...frames.values()];
				frames.clear();
				for (const callback of callbacks) callback(32);
			});
			expect(globalStore.get(currentTimeAtom)).toBe(1800);
			if (simple)
				expect(animations[animations.length - 1]?.currentTime).toBe(800);
			await act(async () => {
				testEngine.musicPlaying = false;
				testEngine.interpolatedCurrentTime = 0;
				testEngine.dispatchEvent(new Event("music-seeked"));
			});
			expect(line?.getAttribute("data-state")).toBe("not-sung");
		} finally {
			await act(async () => root.unmount());
		}
	});
});
