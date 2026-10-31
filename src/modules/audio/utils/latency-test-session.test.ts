import { describe, expect, it, vi } from "vitest";
import {
	getLatencyStatistics,
	subscribeLatencyTestTaps,
} from "./latency-test-session";

describe("latency statistics", () => {
	it("waits for 20 taps before recommending an offset", () => {
		expect(getLatencyStatistics([], 0)).toBeNull();
		expect(
			getLatencyStatistics(Array(19).fill(-0.05), 0)?.recommendedOffset,
		).toBeNull();
		expect(getLatencyStatistics(Array(20).fill(-0.05), 0)).toEqual({
			count: 20,
			meanAbsoluteError: 50,
			recommendedOffset: -50,
		});
	});
	it("accounts for the applied offset without doubling the correction", () => {
		expect(
			getLatencyStatistics(Array(20).fill(0), -50)?.recommendedOffset,
		).toBe(-50);
		expect(
			getLatencyStatistics(Array(20).fill(-0.02), -30)?.recommendedOffset,
		).toBe(-50);
		expect(
			getLatencyStatistics(Array(20).fill(0.02), 30)?.recommendedOffset,
		).toBe(50);
	});
	it("uses the median to resist outliers and measures absolute error", () => {
		const samples = [...Array(19).fill(-0.05), 0.45];
		expect(getLatencyStatistics(samples, 0)).toEqual({
			count: 20,
			meanAbsoluteError: 70,
			recommendedOffset: -50,
		});
		expect(samples[19]).toBe(0.45);
		expect(
			getLatencyStatistics(
				[...Array(10).fill(-0.04), ...Array(10).fill(-0.06)],
				0,
			)?.recommendedOffset,
		).toBe(-50);
	});
});

describe("latency test tap lifecycle", () => {
	it("does not subscribe while closed or stopped", () => {
		const subscribe = vi.fn(() => vi.fn());
		expect(subscribeLatencyTestTaps(false, subscribe, vi.fn())).toBeUndefined();
		expect(subscribe).not.toHaveBeenCalled();
	});
	it("unregisters on close/unmount and rejects a queued tap after cleanup", () => {
		let callback = (_event: number) => {};
		const unsubscribe = vi.fn();
		const onTap = vi.fn();
		const cleanup = subscribeLatencyTestTaps(
			true,
			(listener) => {
				callback = listener;
				return unsubscribe;
			},
			onTap,
		);
		callback(10);
		expect(onTap).toHaveBeenCalledWith(10);
		cleanup?.();
		callback(20);
		expect(unsubscribe).toHaveBeenCalledOnce();
		expect(onTap).toHaveBeenCalledTimes(1);
	});
});
