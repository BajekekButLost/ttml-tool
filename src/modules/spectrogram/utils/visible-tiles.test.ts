// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { TileComponentProps } from "../components/TileComponent";
import type { TileEntry } from "../hooks/useSpectrogramWorker";
import { LRUCache } from "./lru-cache";
import { updateVisibleSpectrogramTiles } from "./visible-tiles";

function setup() {
	const tileCache = { current: new LRUCache<string, TileEntry>(70) };
	const requestTileIfNeeded = vi.fn();
	const setVisibleTiles = vi.fn<(tiles: TileComponentProps[]) => void>();
	const context = {
		audioBuffer: { duration: 14 } as AudioBuffer,
		scrollContainerRef: { current: document.createElement("div") },
		containerWidth: 600,
		gain: 2,
		dataHeight: 300,
		requestTileIfNeeded,
		tileCache,
		palette: { id: "test" },
		zoom: 200,
		scrollLeft: 0,
		fftSize: 1024,
		setVisibleTiles,
	};
	return { context, requestTileIfNeeded, setVisibleTiles, tileCache };
}

describe("spectrogram tile preparation", () => {
	it("bounds prefetch to the audio, keeps five-second tiles and chooses sufficient resolution", () => {
		const { context, requestTileIfNeeded, setVisibleTiles } = setup();
		updateVisibleSpectrogramTiles(context);
		expect(
			requestTileIfNeeded.mock.calls.map(([request]) => request.tileIndex),
		).toEqual([0, 1, 2]);
		expect(requestTileIfNeeded.mock.calls[2][0]).toEqual({
			tileIndex: 2,
			startTime: 10,
			endTime: 15,
			gain: 2,
			height: 300,
			tileWidthPx: 1024,
			paletteId: "test",
			fftSize: 1024,
		});
		expect(
			setVisibleTiles.mock.calls[0][0].map((tile) => [tile.left, tile.width]),
		).toEqual([
			[0, 1000],
			[1000, 1000],
			[2000, 1000],
		]);
	});
	it("reuses cached bitmaps and caps the requested resolution at the existing LOD maximum", () => {
		const { context, tileCache, requestTileIfNeeded, setVisibleTiles } =
			setup();
		const bitmap = { width: 512, height: 300 } as ImageBitmap;
		tileCache.current.set("tile-0", {
			bitmap,
			width: 512,
			height: 300,
			gain: 2,
			paletteId: "test",
		});
		updateVisibleSpectrogramTiles({ ...context, zoom: 2000 });
		expect(requestTileIfNeeded.mock.calls[0][0].tileWidthPx).toBe(8192);
		expect(setVisibleTiles.mock.calls[0][0][0]).toMatchObject({
			bitmap,
			canvasWidth: 512,
			width: 10000,
		});
	});
	it("does nothing when the audio or mounted container is absent", () => {
		const { context, requestTileIfNeeded, setVisibleTiles } = setup();
		updateVisibleSpectrogramTiles({ ...context, audioBuffer: null });
		updateVisibleSpectrogramTiles({
			...context,
			scrollContainerRef: { current: null },
		});
		expect(requestTileIfNeeded).not.toHaveBeenCalled();
		expect(setVisibleTiles).not.toHaveBeenCalled();
	});
});
