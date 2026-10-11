import { useAtomValue } from "jotai";
import { type FC, memo } from "react";
import { currentTimeAtom } from "$/modules/audio/states/index.ts";
import { useScrubbing } from "$/modules/spectrogram/hooks/useScrubbing.ts";
import styles from "./AudioSpectrogram.module.css";

export const PlayheadCursor: FC<{ zoom: number }> = memo(({ zoom }) => {
	const currentTimeInMs = useAtomValue(currentTimeAtom);
	const cursorPosition = (currentTimeInMs / 1000) * zoom;

	return (
		<div
			className={styles.playheadCursor}
			style={{
				left: `${cursorPosition}px`,
			}}
		/>
	);
});

export const ScrubHandle: FC<{
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
	scrollLeft: number;
	zoom: number;
	containerWidth: number;
}> = memo(({ scrollContainerRef, scrollLeft, zoom, containerWidth }) => {
	const currentTimeInMs = useAtomValue(currentTimeAtom);
	const { handleScrubStart } = useScrubbing(
		scrollContainerRef,
		scrollLeft,
		zoom,
	);
	const handleLeftPosition = (currentTimeInMs / 1000) * zoom - scrollLeft;

	return (
		<div
			className={styles.playheadScrubHandle}
			style={{
				left: `${handleLeftPosition}px`,
				display:
					handleLeftPosition < 0 || handleLeftPosition > containerWidth
						? "none"
						: "block",
			}}
			onMouseDown={handleScrubStart}
		/>
	);
});
