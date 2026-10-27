// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPreviewScroll, previewScrollTop } from "./preview-scroll";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function setup(pauseMs = 750) {
	vi.useFakeTimers();
	vi.spyOn(performance, "now").mockImplementation(() => Date.now());
	const viewport = document.createElement("div");
	const node = document.createElement("div");
	Object.defineProperties(viewport, {
		clientHeight: { value: 400 },
		scrollHeight: { value: 2000 },
	});
	vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue(
		new DOMRect(0, 100, 500, 400),
	);
	vi.spyOn(node, "getBoundingClientRect").mockReturnValue(
		new DOMRect(0, 700, 400, 80),
	);
	viewport.scrollTo = vi.fn();
	let id: string | undefined = "a";
	const getTarget = () => (id ? { id, getNode: () => node } : undefined);
	const scroll = createPreviewScroll(viewport, { getTarget, pauseMs });
	return {
		viewport,
		node,
		scroll,
		setId: (next?: string) => {
			id = next;
		},
	};
}

describe("shared preview scroll", () => {
	it("hands targets with a known position to a view's own scroller", () => {
		vi.useFakeTimers();
		vi.spyOn(performance, "now").mockImplementation(() => Date.now());
		const viewport = document.createElement("div");
		viewport.scrollTo = vi.fn();
		const scroller = {
			jump: vi.fn(),
			glide: vi.fn(),
			cancel: vi.fn(),
			isGliding: vi.fn(() => false),
		};
		let id = "a";
		const getTop = vi.fn((anchor: number, offset: number) => {
			expect([anchor, offset]).toEqual([0.5, 30]);
			return 640;
		});
		const scroll = createPreviewScroll(viewport, {
			getTarget: () => ({ id, getNode: () => undefined, getTop }),
			offset: 30,
			scroller,
		});
		scroll.follow();
		expect(scroller.glide).toHaveBeenCalledTimes(1);
		expect(scroller.glide.mock.calls[0][0]()).toBe(640);
		// Same line: no new glide. A seek always jumps.
		scroll.follow();
		expect(scroller.glide).toHaveBeenCalledTimes(1);
		scroll.follow(true);
		expect(scroller.jump).toHaveBeenCalledTimes(1);
		expect(viewport.scrollTo).not.toHaveBeenCalled();
		// The scroller's own writes are not user input.
		scroller.isGliding.mockReturnValue(true);
		viewport.dispatchEvent(new Event("scroll"));
		expect(scroller.cancel).not.toHaveBeenCalled();
		// The user taking over stops the glide and pauses following.
		scroller.isGliding.mockReturnValue(false);
		viewport.dispatchEvent(new Event("wheel"));
		expect(scroller.cancel).toHaveBeenCalled();
		id = "b";
		scroll.follow();
		expect(scroller.glide).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(750);
		expect(scroller.glide).toHaveBeenCalledTimes(2);
		scroll.dispose();
	});

	it("retains each renderer's placement and clamps both ends", () => {
		expect(previewScrollTop(100, 600, 80, 400, 1600, 0.4, 0)).toBe(580);
		expect(previewScrollTop(100, 600, 80, 400, 1600, 0.5, 30)).toBe(570);
		expect(previewScrollTop(100, 600, 80, 400, 1600, 0.5, 0)).toBe(540);
		expect(previewScrollTop(0, -100, 80, 400, 1600, 0.5, 0)).toBe(0);
		expect(previewScrollTop(1000, 900, 80, 400, 1600, 0.5, 0)).toBe(1600);
	});

	it("follows an offscreen target once and recenters the same line on seek", () => {
		const { viewport, scroll } = setup();
		scroll.follow();
		expect(viewport.scrollTo).toHaveBeenLastCalledWith({
			top: 440,
			behavior: "smooth",
		});
		scroll.follow();
		expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
		scroll.follow(true);
		expect(viewport.scrollTo).toHaveBeenLastCalledWith({
			top: 440,
			behavior: "auto",
		});
		scroll.dispose();
	});

	it("resumes after manual scrolling even without another playback frame", () => {
		const { viewport, scroll, setId } = setup();
		scroll.follow();
		viewport.dispatchEvent(new Event("wheel"));
		// One immediate scroll cancels the in-flight native smooth scroll.
		expect(viewport.scrollTo).toHaveBeenLastCalledWith({
			top: 0,
			behavior: "auto",
		});
		setId("b");
		scroll.follow();
		expect(viewport.scrollTo).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(750);
		expect(viewport.scrollTo).toHaveBeenCalledTimes(3);
		scroll.dispose();
	});

	it("distinguishes native auto-scroll events from manual scrollbar scrolling", () => {
		const { viewport, scroll, setId } = setup();
		scroll.follow();
		viewport.dispatchEvent(new Event("scroll"));
		setId("b");
		scroll.follow();
		expect(viewport.scrollTo).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(100);
		viewport.dispatchEvent(new Event("scroll"));
		setId("c");
		scroll.follow();
		expect(viewport.scrollTo).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(750);
		expect(viewport.scrollTo).toHaveBeenCalledTimes(3);
		scroll.dispose();
	});

	it("lets paused seeks override the manual-scroll grace period", () => {
		const { viewport, scroll } = setup();
		viewport.dispatchEvent(new Event("wheel"));
		scroll.follow();
		expect(viewport.scrollTo).not.toHaveBeenCalled();
		scroll.follow(true);
		expect(viewport.scrollTo).toHaveBeenLastCalledWith({
			top: 440,
			behavior: "auto",
		});
		scroll.dispose();
	});

	it("keeps Timing Overview's longer grace period as an explicit option", () => {
		const { viewport, scroll } = setup(3500);
		viewport.dispatchEvent(new Event("touchmove"));
		vi.advanceTimersByTime(750);
		expect(viewport.scrollTo).not.toHaveBeenCalled();
		vi.advanceTimersByTime(2750);
		expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
		scroll.dispose();
	});

	it("does not fight a held pointer and cancels pending work on unmount", () => {
		const { viewport, scroll } = setup();
		viewport.dispatchEvent(new Event("pointerdown"));
		vi.advanceTimersByTime(1000);
		scroll.follow(true);
		expect(viewport.scrollTo).not.toHaveBeenCalled();
		window.dispatchEvent(new Event("pointerup"));
		scroll.dispose();
		vi.advanceTimersByTime(1000);
		expect(viewport.scrollTo).not.toHaveBeenCalled();
	});

	it("re-follows a line after a gap", () => {
		const { viewport, scroll, setId } = setup();
		scroll.follow();
		setId();
		scroll.follow();
		setId("a");
		scroll.follow();
		expect(viewport.scrollTo).toHaveBeenCalledTimes(2);
		scroll.dispose();
	});

	it("reveals virtual rows once, measures after mount and cancels stale retries", () => {
		const { viewport, node, scroll: unused } = setup();
		unused.dispose();
		const frames = new Map<number, FrameRequestCallback>();
		let frameId = 0;
		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
			frames.set(++frameId, callback);
			return frameId;
		});
		vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
		const step = () => {
			const callbacks = [...frames.values()];
			frames.clear();
			for (const callback of callbacks) callback(16);
		};
		let mounted = false;
		const reveal = vi.fn(() => {
			mounted = true;
		});
		const scroll = createPreviewScroll(viewport, {
			getTarget: () => ({
				id: "virtual",
				getNode: () => (mounted ? node : undefined),
				reveal,
			}),
		});
		scroll.follow(true);
		scroll.follow();
		expect(reveal).toHaveBeenCalledTimes(1);
		step();
		step();
		expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
		mounted = false;
		scroll.follow(true);
		scroll.dispose();
		expect(frames.size).toBe(0);
	});
});
