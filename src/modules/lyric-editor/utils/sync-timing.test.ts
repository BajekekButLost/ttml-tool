import { describe, expect, it } from "vitest";
import { SyncJudgeMode } from "$/modules/settings/states";
import { calculateSyncTime } from "./sync-timing";

const baseOptions = {
	audioTimeSeconds: 10,
	playbackRate: 1,
	isPlaying: true,
	event: { downTimeOffset: 200, triggerTime: 1_000 },
	syncTimeOffset: 0,
	performanceTime: 1_050,
};

describe("calculateSyncTime", () => {
	it("removes callback delay and uses the first key-down instant", () => {
		expect(
			calculateSyncTime({
				...baseOptions,
				judgeMode: SyncJudgeMode.FirstKeyDownTime,
			}),
		).toBe(9_750);
	});

	it("uses the key-up or midpoint instant when configured", () => {
		expect(
			calculateSyncTime({
				...baseOptions,
				judgeMode: SyncJudgeMode.LastKeyUpTime,
			}),
		).toBe(9_950);
		expect(
			calculateSyncTime({
				...baseOptions,
				judgeMode: SyncJudgeMode.MiddleKeyTime,
			}),
		).toBe(9_850);
	});

	it("scales real-time delays by playback rate", () => {
		expect(
			calculateSyncTime({
				...baseOptions,
				playbackRate: 0.5,
				judgeMode: SyncJudgeMode.FirstKeyDownTime,
			}),
		).toBe(9_875);
	});

	it.each(
		Object.values(SyncJudgeMode),
	)("uses the paused playhead plus offsets in %s", (judgeMode) => {
		for (const delay of [0, 4, 75]) {
			for (const downTimeOffset of [0, 100, 999]) {
				expect(
					calculateSyncTime({
						...baseOptions,
						isPlaying: false,
						playbackRate: 0.5,
						event: { downTimeOffset, triggerTime: 1_000 },
						performanceTime: 1_000 + delay,
						syncTimeOffset: -25,
						actionOffset: 5,
						judgeMode,
					}),
				).toBe(9_980);
			}
		}
	});

	it("clamps a paused offset before zero", () => {
		expect(
			calculateSyncTime({
				...baseOptions,
				audioTimeSeconds: 0.01,
				isPlaying: false,
				syncTimeOffset: -100,
				judgeMode: SyncJudgeMode.FirstKeyDownTimeLegacy,
			}),
		).toBe(0);
	});

	it("normalizes epoch-based event timestamps", () => {
		expect(
			calculateSyncTime({
				...baseOptions,
				event: {
					downTimeOffset: 0,
					triggerTime: 1_700_000_001_000,
				},
				performanceTimeOrigin: 1_700_000_000_000,
				judgeMode: SyncJudgeMode.LastKeyUpTime,
			}),
		).toBe(9_950);
	});

	it("applies action offsets before clamping the final result", () => {
		expect(
			calculateSyncTime({
				...baseOptions,
				audioTimeSeconds: 0.1,
				event: { downTimeOffset: 0, triggerTime: 1_050 },
				judgeMode: SyncJudgeMode.LastKeyUpTime,
				actionOffset: -500,
			}),
		).toBe(0);
	});
});
