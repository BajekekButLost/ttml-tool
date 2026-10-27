import { type RefObject, useEffect } from "react";
import { playbackClock } from ".";
import {
	createPreviewScroll,
	type PreviewScrollTarget,
} from "./preview-scroll";

export function usePreviewScroll(
	viewport: RefObject<HTMLElement | null>,
	getTarget: (timeMs: number) => PreviewScrollTarget | undefined,
	{ enabled = true, anchor = 0.5, offset = 0, pauseMs = 750 } = {},
) {
	useEffect(() => {
		if (!enabled || !viewport.current) return;
		const scroll = createPreviewScroll(viewport.current, {
			getTarget: () => getTarget(playbackClock.getSnapshot() * 1000),
			anchor,
			offset,
			pauseMs,
		});
		const unsubscribe = playbackClock.subscribe((_seconds, _now, seeked) => {
			scroll.follow(seeked);
		});
		scroll.follow(true);
		return () => {
			unsubscribe();
			scroll.dispose();
		};
	}, [viewport, getTarget, enabled, anchor, offset, pauseMs]);
}
