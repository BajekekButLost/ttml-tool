/*
 * Adapted from the Spicy Lyrics renderer (AGPL-3.0-or-later).
 * Original project: https://github.com/Spikerko/Spicy-Lyrics
 */
import { type RefObject, useEffect, useState } from "react";
import { audioEngine } from "$/modules/audio/audio-engine";
import { playbackClock } from "$/modules/playback-clock";
import { type CoverPalette, getCoverPalette } from "./cover-palette";
import styles from "./index.module.css";

type KawarpInstance = {
	dispose(): void;
	loadImage(url: string): Promise<void>;
	start(): void;
	setOptions(options: {
		animationSpeed?: number;
		transitionDuration?: number;
	}): void;
};
export function useCoverPalette(imageSource: string | null) {
	const [palette, setPalette] = useState<CoverPalette | null>(null);
	useEffect(() => {
		if (!imageSource) {
			setPalette(null);
			return;
		}
		let cancelled = false;
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.src = imageSource;
		void image
			.decode()
			.then(() => {
				const canvas = document.createElement("canvas");
				canvas.width = 32;
				canvas.height = 32;
				const context = canvas.getContext("2d", { willReadFrequently: true });
				if (!context) return;
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
				const { data } = context.getImageData(
					0,
					0,
					canvas.width,
					canvas.height,
				);
				const nextPalette = getCoverPalette(data);
				if (!nextPalette || cancelled) return;
				setPalette(nextPalette);
			})
			.catch(() => {
				if (!cancelled) setPalette(null);
			});
		return () => {
			cancelled = true;
		};
	}, [imageSource]);
	return palette;
}

export function useKawarpBackground(
	container: RefObject<HTMLDivElement | null>,
	image: string | null,
	mode: "animated" | "color" | "static",
) {
	useEffect(() => {
		if (mode !== "animated" || !image || !container.current) return;
		let disposed = false;
		let instance: KawarpInstance | null = null;
		let unsubscribe: (() => void) | undefined;
		const canvas = document.createElement("canvas");
		canvas.className = styles.backgroundCanvas;
		container.current.replaceChildren(canvas);
		void import("@kawarp/core")
			.then(async ({ default: Kawarp }) => {
				if (disposed) return;
				instance = new Kawarp(canvas, {
					warpIntensity: 1,
					blurPasses: 8,
					animationSpeed: 0.1,
					saturation: 1.5,
					dithering: 0.008,
					tintIntensity: 0,
					scale: 1,
					transitionDuration: 500,
				}) as KawarpInstance;
				await instance.loadImage(image);
				if (disposed) return;
				instance.start();
				const bins = new Uint8Array(audioEngine.analyserNode.frequencyBinCount);
				const animate = () => {
					audioEngine.analyserNode.getByteFrequencyData(bins);
					const energy =
						bins.reduce((sum, value) => sum + value, 0) / (bins.length * 255);
					instance?.setOptions({ animationSpeed: 0.1 + energy * 0.35 });
				};
				animate();
				unsubscribe = playbackClock.subscribe(animate);
			})
			.catch(() => container.current?.replaceChildren());
		return () => {
			disposed = true;
			unsubscribe?.();
			instance?.dispose();
		};
	}, [container, image, mode]);
}
