/*
 * Adapted from the Spicy Lyrics renderer (AGPL-3.0-or-later).
 * Original project: https://github.com/Spikerko/Spicy-Lyrics
 */
import type { PreviewScroller } from "$/modules/playback-clock/preview-scroll";
import { Spring } from "./math";

// Critically damped, so the list never overshoots the line, and settles in
// about 0.8s. A retarget mid-flight keeps the velocity, which is what makes
// back-to-back line changes read as one continuous glide.
const FREQUENCY = 1;
const DAMPING = 1;
// Done once this close (px) to the goal and moving slower than this per frame.
const SETTLE_PX = 0.25;
const SETTLE_SPEED = 0.05;
// Largest single spring step, and the most time one frame may account for.
const MAX_STEP = 0.05;
const MAX_ELAPSED = 0.1;
// Times a glide may re-aim after landing somewhere the layout moved under it.
const MAX_RECONCILES = 3;
// Times an instant jump may re-aim while rows above it replace estimates
// with measured sizes.
const MAX_JUMP_CORRECTIONS = 10;
// Scroll events this soon after our own write are ours, not the user's.
const WRITE_ECHO_MS = 100;

// scrollTop lands on device pixels, not CSS pixels, so a glide that assumed
// whole CSS pixels would shimmer at fractional zoom.
const scrollStep = (element: HTMLElement) =>
	1 / (element.ownerDocument.defaultView?.devicePixelRatio || 1);

const prefersReducedMotion = () =>
	typeof matchMedia === "function" &&
	matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface GlideScrollerOptions {
	/** The element carrying the rows; it takes the sub-pixel remainder. */
	getContent: () => HTMLElement | null;
	/** One-shot frames on the lyrics' own frame clock. */
	requestFrame: (callback: FrameRequestCallback) => number;
	cancelFrame: (id: number) => void;
	/** Keeps the rows between here and `goal` mounted while gliding. */
	onGlideStart?: (goal: number) => void;
	onGlideEnd?: () => void;
}

export interface GlideScroller extends PreviewScroller {
	/** The list's layout changed; re-aim a recent jump if it moved its target. */
	relayout: () => void;
}

export function createGlideScroller(
	viewport: HTMLElement,
	options: GlideScrollerOptions,
): GlideScroller {
	const spring = new Spring(viewport.scrollTop, FREQUENCY, DAMPING);
	type GetTop = () => number | undefined;
	let target: GetTop | undefined;
	let frame: number | null = null;
	let lastTs: number | null = null;
	let frameAvg: number | null = null;
	let lastPosition: number | null = null;
	let lastWhole: number | null = null;
	let fraction = 0;
	let reconciles = 0;
	let jumpTarget: GetTop | undefined;
	let jumpCorrections = 0;
	let lastWrite = Number.NEGATIVE_INFINITY;

	// On a scroll step, so the glide ends where scrollTop can actually sit.
	const goalFor = (getTop: GetTop) => {
		const top = getTop();
		if (top === undefined) return undefined;
		const step = scrollStep(viewport);
		return Math.round(top / step) * step;
	};
	const setFraction = (value: number) => {
		if (Math.abs(value - fraction) < 0.01 && value !== 0) return;
		fraction = value;
		const content = options.getContent();
		if (content) content.style.translate = value === 0 ? "" : `0 ${-value}px`;
	};
	const write = (top: number) => {
		// "instant" overrides any CSS smooth scrolling, which would ease each
		// per-frame write and fight the spring.
		lastWrite = performance.now();
		viewport.scrollTo({ top, behavior: "instant" });
	};
	const stopJump = () => {
		jumpTarget = undefined;
	};
	const stop = () => {
		const wasGliding = frame !== null || target !== undefined;
		if (frame !== null) options.cancelFrame(frame);
		frame = null;
		target = undefined;
		lastTs = null;
		lastPosition = null;
		lastWhole = null;
		setFraction(0);
		if (wasGliding) options.onGlideEnd?.();
	};

	const step = (ts: number) => {
		frame = null;
		const current = target;
		const goal = current && goalFor(current);
		if (current === undefined || goal === undefined) {
			stop();
			return;
		}
		spring.setGoal(goal);
		// A frame that arrives well after the usual interval only advances by
		// twice it, so a dropped frame resumes the glide instead of leaping.
		const raw =
			lastTs === null ? 1 / 60 : Math.min((ts - lastTs) / 1000, MAX_ELAPSED);
		lastTs = ts;
		const usual = frameAvg ?? raw;
		let elapsed = Math.min(raw, Math.max(usual * 2, 1 / 60));
		frameAvg = usual * 0.9 + raw * 0.1;
		let position = spring.step(Math.min(elapsed, MAX_STEP));
		elapsed -= MAX_STEP;
		while (elapsed > 0) {
			position = spring.step(Math.min(elapsed, MAX_STEP));
			elapsed -= MAX_STEP;
		}
		position = Math.max(0, position);
		const moved =
			lastPosition === null ? Infinity : Math.abs(position - lastPosition);
		lastPosition = position;
		const settled =
			Math.abs(position - goal) < SETTLE_PX && moved < SETTLE_SPEED;

		// Scroll by whole device pixels and carry the rest as a translate, so
		// the slow end of the ease doesn't tick one pixel at a time.
		const px = scrollStep(viewport);
		const whole = settled ? goal : Math.round(position / px) * px;
		if (lastWhole === null || Math.abs(whole - lastWhole) > px / 2) {
			write(whole);
			lastWhole = whole;
		}
		setFraction(settled ? 0 : position - whole);

		if (!settled) {
			frame = options.requestFrame(step);
			return;
		}
		// The browser clamps scrollTop if the list changed size underneath us;
		// re-aim from where it really is.
		const actual = viewport.scrollTop;
		if (Math.abs(actual - goal) > 1 && reconciles < MAX_RECONCILES) {
			reconciles++;
			lastWhole = actual;
			lastPosition = null;
			spring.setGoal(actual, true);
			frame = options.requestFrame(step);
			return;
		}
		stop();
	};

	// Rows mounted by a jump replace estimated sizes with measured ones, which
	// moves the target. Re-aim when that happens instead of polling frames, so
	// a paused list stays idle.
	const relayout = () => {
		const current = jumpTarget;
		if (current === undefined || frame !== null) return;
		const goal = goalFor(current);
		if (goal === undefined || Math.abs(viewport.scrollTop - goal) <= 1) return;
		write(goal);
		spring.setGoal(goal, true);
		if (++jumpCorrections >= MAX_JUMP_CORRECTIONS) stopJump();
	};

	const jump = (next: GetTop) => {
		stop();
		stopJump();
		const goal = goalFor(next);
		if (goal === undefined) return;
		write(goal);
		spring.setGoal(goal, true);
		jumpTarget = next;
		jumpCorrections = 0;
	};

	const glide = (next: GetTop) => {
		if (prefersReducedMotion()) {
			jump(next);
			return;
		}
		stopJump();
		const goal = goalFor(next);
		if (goal === undefined) return;
		const gliding = frame !== null;
		// Already there: no frames for a glide that wouldn't move.
		if (!gliding && Math.abs(viewport.scrollTop - goal) < SETTLE_PX) return;
		// Where the list is drawn right now, sub-pixel remainder included.
		if (!gliding) spring.setGoal(viewport.scrollTop + fraction, true);
		target = next;
		reconciles = 0;
		options.onGlideStart?.(goal);
		if (!gliding) {
			lastTs = null;
			lastPosition = null;
			lastWhole = null;
			frame = options.requestFrame(step);
		}
	};

	return {
		jump,
		glide,
		relayout,
		cancel: () => {
			stop();
			stopJump();
		},
		isGliding: () =>
			frame !== null || performance.now() - lastWrite < WRITE_ECHO_MS,
	};
}
