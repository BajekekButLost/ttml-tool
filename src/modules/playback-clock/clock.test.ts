import { describe, expect, it, vi } from "vitest";
import { createPlaybackClock } from "./clock";

function setup(playing = false) {
	let seconds = 0;
	const read = vi.fn(() => seconds);
	class FakeEngine extends EventTarget {
		musicPlaying = playing;
		get interpolatedCurrentTime() {
			return read();
		}
	}
	const source = new FakeEngine();
	const pending = new Map<number, FrameRequestCallback>();
	let id = 0;
	let now = 0;
	const frames = {
		request: vi.fn((callback: FrameRequestCallback) => {
			pending.set(++id, callback);
			return id;
		}),
		cancel: vi.fn((frame: number) => pending.delete(frame)),
		now: () => now,
	};
	const clock = createPlaybackClock(source, frames);
	const tick = (position: number) => {
		seconds = position;
		now += 16;
		const callbacks = [...pending.values()];
		pending.clear();
		for (const callback of callbacks) callback(now);
	};
	const event = (name: string, position = seconds) => {
		seconds = position;
		source.dispatchEvent(new Event(name));
	};
	return { clock, source, read, pending, frames, tick, event };
}

describe("UI playback clock", () => {
	it("shares one frame and one engine read among all subscribers", () => {
		const { clock, source, read, pending, tick, event } = setup();
		const listeners = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
		for (const listener of listeners) clock.subscribe(listener);
		expect(pending.size).toBe(0);
		source.musicPlaying = true;
		event("music-resume");
		expect(pending.size).toBe(1);
		read.mockClear();
		event("music-timeupdate", 0.12);
		event("music-timeupdate", 0.13);
		expect(read).not.toHaveBeenCalled();
		tick(0.140125);
		expect(read).toHaveBeenCalledTimes(1);
		for (const listener of listeners)
			expect(listener).toHaveBeenLastCalledWith(0.140125, 16, false);
		expect(pending.size).toBe(1);
		clock.dispose();
		expect(pending.size).toBe(0);
	});

	it("publishes paused seeks synchronously and remains idle", () => {
		const { clock, pending, event } = setup();
		const listener = vi.fn();
		clock.subscribe(listener);
		event("music-seeked", 8.125);
		expect(clock.getSnapshot()).toBe(8.125);
		expect(listener).toHaveBeenLastCalledWith(8.125, 0, true);
		expect(pending.size).toBe(0);
		clock.dispose();
	});

	it("never extrapolates stalled engine time or adjusts it for playback rate", () => {
		const { clock, event, tick } = setup(true);
		const listener = vi.fn();
		clock.subscribe(listener);
		tick(0.5);
		for (let i = 0; i < 20; i++) tick(0.5);
		expect(clock.getSnapshot()).toBe(0.5);
		// A rate event requires neither another loop nor another time estimate.
		event("music-playback-rate-change");
		tick(0.508);
		expect(clock.getSnapshot()).toBe(0.508);
		clock.dispose();
	});

	it("cancels immediately on pause, restarts once, and resets on unload", () => {
		const { clock, source, event, tick, pending } = setup(true);
		tick(3);
		source.musicPlaying = false;
		event("music-pause", 3.01);
		expect(clock.getSnapshot()).toBe(3.01);
		expect(pending.size).toBe(0);
		source.musicPlaying = true;
		event("music-resume");
		event("music-resume");
		expect(pending.size).toBe(1);
		source.musicPlaying = false;
		event("music-unload", 0);
		expect(clock.getSnapshot()).toBe(0);
		expect(pending.size).toBe(0);
		clock.dispose();
	});

	it("unsubscribes cleanly and retains seeks made without a mounted view", () => {
		const { clock, event } = setup();
		const oldView = vi.fn();
		const unsubscribe = clock.subscribe(oldView);
		unsubscribe();
		event("music-seeked", 6);
		expect(oldView).not.toHaveBeenCalled();
		expect(clock.getSnapshot()).toBe(6);
		clock.dispose();
		event("music-seeked", 9);
		expect(clock.getSnapshot()).toBe(6);
	});
});
