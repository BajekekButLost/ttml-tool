// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGlideScroller } from "./glide-scroller";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const last = (values: number[]) => values[values.length - 1];

function setup(reducedMotion = false) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({ matches: reducedMotion })),
	);
	const viewport = document.createElement("div");
	const content = document.createElement("div");
	let top = 0;
	Object.defineProperty(viewport, "scrollTop", { get: () => top });
	const writes: number[] = [];
	viewport.scrollTo = vi.fn((options?: ScrollToOptions | number) => {
		top = (options as ScrollToOptions).top ?? top;
		writes.push(top);
	}) as typeof viewport.scrollTo;
	const frames = new Map<number, FrameRequestCallback>();
	let id = 0;
	let now = 0;
	const onGlideStart = vi.fn();
	const onGlideEnd = vi.fn();
	const scroller = createGlideScroller(viewport, {
		getContent: () => content,
		requestFrame: (callback) => {
			frames.set(++id, callback);
			return id;
		},
		cancelFrame: (frame) => frames.delete(frame),
		onGlideStart,
		onGlideEnd,
	});
	const tick = () => {
		now += 1000 / 60;
		const callbacks = [...frames.values()];
		frames.clear();
		for (const callback of callbacks) callback(now);
	};
	return {
		viewport,
		content,
		scroller,
		frames,
		writes,
		tick,
		onGlideStart,
		onGlideEnd,
		setTop: (value: number) => {
			top = value;
		},
	};
}

describe("Spicy glide scroller", () => {
	it("glides to the line with a critically damped spring and lands exactly", () => {
		const {
			scroller,
			frames,
			writes,
			tick,
			content,
			onGlideStart,
			onGlideEnd,
		} = setup();
		scroller.glide(() => 600);
		expect(onGlideStart).toHaveBeenCalledWith(600);
		expect(scroller.isGliding()).toBe(true);
		let previous = 0;
		let sawFraction = false;
		for (let i = 0; i < 240 && frames.size > 0; i++) {
			tick();
			const drawn =
				(last(writes) ?? 0) -
				Number.parseFloat(content.style.translate.split(" ")[1] || "0");
			// Never overshoots, never moves backwards.
			expect(drawn).toBeGreaterThanOrEqual(previous - 1e-6);
			expect(drawn).toBeLessThanOrEqual(600 + 1e-6);
			if (content.style.translate) sawFraction = true;
			previous = drawn;
		}
		expect(frames.size).toBe(0);
		expect(last(writes)).toBe(600);
		expect(content.style.translate).toBe("");
		expect(sawFraction).toBe(true);
		expect(onGlideEnd).toHaveBeenCalledTimes(1);
		// Spread over many frames, not one jump.
		expect(writes.length).toBeGreaterThan(20);
	});

	it("keeps its velocity when the target moves mid-glide", () => {
		const { scroller, frames, writes, tick } = setup();
		scroller.glide(() => 400);
		for (let i = 0; i < 10; i++) tick();
		const midway = last(writes) ?? 0;
		scroller.glide(() => 800);
		tick();
		expect(last(writes)).toBeGreaterThan(midway);
		while (frames.size > 0) tick();
		expect(last(writes)).toBe(800);
	});

	it("jumps instead of gliding with reduced motion", () => {
		const { scroller, frames, writes, onGlideStart } = setup(true);
		scroller.glide(() => 500);
		expect(writes).toEqual([500]);
		expect(frames.size).toBe(0);
		expect(onGlideStart).not.toHaveBeenCalled();
	});

	it("re-aims a jump when measured rows move its target, without frames", () => {
		const { scroller, frames, writes } = setup();
		let goal = 1000;
		scroller.jump(() => goal);
		expect(writes).toEqual([1000]);
		goal = 1180;
		scroller.relayout();
		expect(writes).toEqual([1000, 1180]);
		scroller.relayout();
		expect(writes).toEqual([1000, 1180]);
		expect(frames.size).toBe(0);
		// The user taking over ends it.
		scroller.cancel();
		goal = 1400;
		scroller.relayout();
		expect(writes).toEqual([1000, 1180]);
	});

	it("stops where it is when cancelled", () => {
		const { scroller, frames, writes, tick, content, onGlideEnd } = setup();
		scroller.glide(() => 600);
		tick();
		tick();
		scroller.cancel();
		expect(frames.size).toBe(0);
		expect(content.style.translate).toBe("");
		expect(onGlideEnd).toHaveBeenCalledTimes(1);
		const stopped = last(writes);
		tick();
		expect(last(writes)).toBe(stopped);
	});
});
