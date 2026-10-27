export interface TextSnapshot {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

/** Keystrokes closer together than this share one undo step. */
const TYPING_GROUP_MS = 1000;

/**
 * Undo history for a text area whose value is also replaced by code (text
 * tools, fetched lyrics). Replacing a textarea's value from script wipes the
 * browser's own undo stack, so the text area keeps this one instead and handles
 * undo and redo itself, the same way in every webview.
 */
export class TextHistory {
	private past: TextSnapshot[] = [];
	private future: TextSnapshot[] = [];
	private lastTypingAt = -Infinity;
	private lastKind: "insert" | "delete" | undefined;
	private wordEnded = false;

	constructor(private readonly limit = 200) {}

	get canUndo() {
		return this.past.length > 0;
	}

	get canRedo() {
		return this.future.length > 0;
	}

	/**
	 * Record a typed edit. Single characters typed in a burst share a step,
	 * broken at word ends; pastes and cuts get their own.
	 */
	recordTyping(before: TextSnapshot, after: string, now: number) {
		const delta = after.length - before.value.length;
		const kind = delta >= 0 ? "insert" : "delete";
		const startsStep =
			now - this.lastTypingAt > TYPING_GROUP_MS ||
			kind !== this.lastKind ||
			Math.abs(delta) > 1 ||
			before.selectionStart !== before.selectionEnd ||
			this.wordEnded;
		if (startsStep) this.push(before);
		else this.future = [];
		const typed = delta === 1 ? after.charAt(before.selectionStart) : undefined;
		this.wordEnded = kind === "insert" && !!typed && /\s/.test(typed);
		this.lastKind = kind;
		this.lastTypingAt = now;
	}

	/** Record a whole replacement, such as a text tool, as one step. */
	recordReplace(before: TextSnapshot) {
		this.push(before);
		this.lastTypingAt = -Infinity;
	}

	undo(current: TextSnapshot): TextSnapshot | undefined {
		const previous = this.past.pop();
		if (!previous) return undefined;
		this.future.push(current);
		this.lastTypingAt = -Infinity;
		return previous;
	}

	redo(current: TextSnapshot): TextSnapshot | undefined {
		const next = this.future.pop();
		if (!next) return undefined;
		this.past.push(current);
		this.lastTypingAt = -Infinity;
		return next;
	}

	private push(snapshot: TextSnapshot) {
		this.past.push(snapshot);
		if (this.past.length > this.limit) this.past.shift();
		this.future = [];
	}
}
