/*
 * Adapted from the Spicy Lyrics renderer (AGPL-3.0-or-later).
 * Original project: https://github.com/Spikerko/Spicy-Lyrics
 */
import {
	elementScroll,
	observeElementOffset,
	observeElementRect,
	Virtualizer,
	type VirtualizerOptions,
} from "@tanstack/virtual-core";
import {
	type RefObject,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { playbackClock } from "$/modules/playback-clock";
import {
	type PreviewScroller,
	previewScrollTop,
} from "$/modules/playback-clock/preview-scroll";
import { createGlideScroller } from "./glide-scroller";
import type { SpicyLine } from "./model";

const OVERSCAN = 5;
// Rows a glide keeps mounted at most. Past this the destination is too far to
// be worth holding, and rows mount and unmount as the window slides.
const GLIDE_HOLD_MAX_ROWS = 40;
// Gaps in cqw, baked into each row's padding so rows can differ.
const GAP_NORMAL = 1;
// A background vocal sits closer to its lead.
const GAP_LINE_TO_BG = 0.2;
const ESTIMATE_LINE = 66;
const ESTIMATE_BACKGROUND = 50;

/** Trailing gap of a row in cqw. Interlude rows carry their own gap in CSS. */
export function rowGap(lines: SpicyLine[], index: number) {
	if (index >= lines.length - 1 || lines[index].isDotLine) return 0;
	const next = lines[index + 1];
	return next.isBackground && !next.isDotLine ? GAP_LINE_TO_BG : GAP_NORMAL;
}

export interface SpicyVirtualRow {
	index: number;
	/** Offset from the top of the row container. */
	start: number;
}

interface VirtualWindow {
	rows: SpicyVirtualRow[];
	totalSize: number;
}

type LineVirtualizer = Virtualizer<HTMLDivElement, HTMLDivElement>;

/**
 * Mounts only the rows near the viewport (plus overscan), and glides the list
 * to the active line with a spring instead of the browser's smooth scroll.
 */
export function useSpicyVirtualList(
	lines: SpicyLine[],
	viewportRef: RefObject<HTMLDivElement | null>,
	contentRef: RefObject<HTMLDivElement | null>,
	onRowsMounted: () => void,
) {
	const linesRef = useRef(lines);
	linesRef.current = lines;
	const onRowsMountedRef = useRef(onRowsMounted);
	onRowsMountedRef.current = onRowsMounted;
	const virtualizerRef = useRef<LineVirtualizer | null>(null);
	const optionsRef = useRef<VirtualizerOptions<
		HTMLDivElement,
		HTMLDivElement
	> | null>(null);
	const holdRef = useRef<{ from: number; to: number } | null>(null);
	const signatureRef = useRef("");
	const geometry = useRef({ padTop: 0, padBottom: 0, width: 0, height: 0 });
	const [mounted, setMounted] = useState<VirtualWindow>({
		rows: [],
		totalSize: 0,
	});
	const [scroller, setScroller] = useState<PreviewScroller>();

	const publish = useCallback((v: LineVirtualizer) => {
		const count = linesRef.current.length;
		const indices = new Set(v.getVirtualItems().map((item) => item.index));
		const hold = holdRef.current;
		if (hold)
			for (let i = hold.from; i <= Math.min(hold.to, count - 1); i++)
				indices.add(i);
		const margin = v.options.scrollMargin;
		const rows: SpicyVirtualRow[] = [];
		for (const index of [...indices].sort((a, b) => a - b)) {
			const item = v.measurementsCache[index];
			if (item) rows.push({ index, start: Math.round(item.start - margin) });
		}
		const totalSize = v.getTotalSize();
		// Scrolling inside the window changes nothing here, so React only
		// renders when rows mount, unmount or move.
		const signature = `${rows.map((row) => `${row.index}:${row.start}`).join(",")}|${totalSize}`;
		if (signature === signatureRef.current) return;
		signatureRef.current = signature;
		setMounted({ rows, totalSize });
	}, []);

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const readGeometry = () => {
			const style = getComputedStyle(viewport);
			const next = {
				padTop: Number.parseFloat(style.paddingTop) || 0,
				padBottom: Number.parseFloat(style.paddingBottom) || 0,
				width: viewport.clientWidth,
				height: viewport.clientHeight,
			};
			const marginChanged = next.padTop !== geometry.current.padTop;
			geometry.current = next;
			return marginChanged;
		};
		readGeometry();
		let gliding = false;
		let relayout = () => {};
		const options: VirtualizerOptions<HTMLDivElement, HTMLDivElement> = {
			count: linesRef.current.length,
			getScrollElement: () => viewportRef.current,
			estimateSize: (index) => {
				const line = linesRef.current[index];
				const gap =
					(rowGap(linesRef.current, index) * geometry.current.width) / 100;
				if (!line || line.isDotLine) return gap;
				return (line.isBackground ? ESTIMATE_BACKGROUND : ESTIMATE_LINE) + gap;
			},
			scrollToFn: elementScroll,
			observeElementRect: (instance, cb) =>
				observeElementRect(instance, (rect) => {
					// The list starts below the viewport's top padding, which
					// is relative to the preview's size.
					if (readGeometry() && optionsRef.current) {
						optionsRef.current.scrollMargin = geometry.current.padTop;
						instance.setOptions(optionsRef.current);
					}
					cb(rect);
				}),
			observeElementOffset,
			overscan: OVERSCAN,
			scrollMargin: geometry.current.padTop,
			getItemKey: (index) => linesRef.current[index]?.id ?? index,
			onChange: (instance) => {
				publish(instance);
				relayout();
			},
		};
		optionsRef.current = options;
		const v = new Virtualizer(options);
		// Rows resizing above the viewport keep what's on screen in place,
		// except mid-glide, where the glide re-aims every frame instead.
		v.shouldAdjustScrollPositionOnItemSizeChange = (item, _delta, instance) =>
			!gliding && item.start < (instance.scrollOffset ?? 0);
		virtualizerRef.current = v;
		const cleanup = v._didMount();
		v._willUpdate();
		publish(v);

		const glideScroller = createGlideScroller(viewport, {
			getContent: () => contentRef.current,
			requestFrame: playbackClock.requestFrame,
			cancelFrame: playbackClock.cancelFrame,
			onGlideStart: (goal) => {
				gliding = true;
				// Mount the rows the glide ends on now, and keep everything in
				// between mounted until it lands, so nothing pops in mid-flight.
				const items = v.measurementsCache;
				const visible = v.getVirtualItems();
				if (items.length === 0 || visible.length === 0) return;
				const bottom = goal + geometry.current.height;
				let first = items.findIndex((item) => item.end > goal);
				if (first < 0) first = items.length - 1;
				let last = first;
				while (last + 1 < items.length && items[last + 1].start < bottom)
					last++;
				const from = Math.max(0, Math.min(first - OVERSCAN, visible[0].index));
				const to = Math.min(
					items.length - 1,
					Math.max(last + OVERSCAN, visible[visible.length - 1].index),
				);
				holdRef.current =
					to - from + 1 > GLIDE_HOLD_MAX_ROWS ? null : { from, to };
				publish(v);
			},
			onGlideEnd: () => {
				gliding = false;
				if (!holdRef.current) return;
				holdRef.current = null;
				publish(v);
			},
		});
		relayout = glideScroller.relayout;
		setScroller(glideScroller);
		return () => {
			glideScroller.cancel();
			cleanup();
			virtualizerRef.current = null;
			optionsRef.current = null;
			signatureRef.current = "";
		};
	}, [viewportRef, contentRef, publish]);

	useLayoutEffect(() => {
		const v = virtualizerRef.current;
		const options = optionsRef.current;
		if (!v || !options) return;
		options.count = lines.length;
		v.setOptions(options);
		v._willUpdate();
		publish(v);
	}, [lines, publish]);

	// Rows that just mounted have no animation state on them yet.
	useLayoutEffect(() => {
		if (mounted.rows.length > 0) onRowsMountedRef.current();
	}, [mounted]);

	const measureRow = useCallback((node: HTMLDivElement | null) => {
		virtualizerRef.current?.measureElement(node);
	}, []);

	/** Scroll position that puts line `index` at `anchor` of the viewport. */
	const getTop = useCallback(
		(index: number, anchor: number, offset: number) => {
			const v = virtualizerRef.current;
			const item = v?.measurementsCache[index];
			if (!v || !item) return undefined;
			const { padTop, padBottom, width, height } = geometry.current;
			const gap = (rowGap(linesRef.current, index) * width) / 100;
			const maxTop = Math.max(
				0,
				padTop + v.getTotalSize() + padBottom - height,
			);
			return previewScrollTop(
				0,
				item.start,
				item.size - gap,
				height,
				maxTop,
				anchor,
				offset,
			);
		},
		[],
	);

	return {
		rows: mounted.rows,
		totalSize: mounted.totalSize,
		measureRow,
		getTop,
		scroller,
	};
}
