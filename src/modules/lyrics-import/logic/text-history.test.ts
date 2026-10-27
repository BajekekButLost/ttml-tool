import { describe, expect, it } from "vitest";
import { TextHistory, type TextSnapshot } from "./text-history";

const at = (value: string, caret = value.length): TextSnapshot => ({
	value,
	selectionStart: caret,
	selectionEnd: caret,
});

// Types `text` after `start`, one character every 50ms from `time`.
const type = (history: TextHistory, start: string, text: string, time = 0) => {
	let value = start;
	for (const [index, char] of Array.from(text).entries()) {
		history.recordTyping(at(value), value + char, time + index * 50);
		value += char;
	}
	return value;
};

describe("import text history", () => {
	it("undoes and redoes a tool replacement as one step", () => {
		const history = new TextHistory();
		history.recordReplace(at("raw"));
		expect(history.undo(at("processed"))?.value).toBe("raw");
		expect(history.redo(at("raw"))?.value).toBe("processed");
		expect(history.canRedo).toBe(false);
	});

	it("groups a burst of typing by word", () => {
		const history = new TextHistory();
		const value = type(history, "", "hello world");
		expect(value).toBe("hello world");
		expect(history.undo(at(value))?.value).toBe("hello ");
		expect(history.undo(at("hello "))?.value).toBe("");
		expect(history.canUndo).toBe(false);
	});

	it("starts a new step after a pause, a paste or a tool", () => {
		const history = new TextHistory();
		let value = type(history, "", "ab");
		value = type(history, value, "cd", 5000);
		history.recordTyping(at(value), `${value}pasted`, 5200);
		value = `${value}pasted`;
		history.recordReplace(at(value));
		const steps: string[] = [];
		let current = at("tool result");
		for (let snapshot = history.undo(current); snapshot; ) {
			steps.push(snapshot.value);
			current = snapshot;
			snapshot = history.undo(current);
		}
		expect(steps).toEqual(["abcdpasted", "abcd", "ab", ""]);
	});

	it("drops redo once something new happens", () => {
		const history = new TextHistory();
		history.recordReplace(at("a"));
		history.undo(at("b"));
		history.recordTyping(at("a"), "ax", 0);
		expect(history.canRedo).toBe(false);
	});

	it("keeps the selection to restore", () => {
		const history = new TextHistory();
		history.recordReplace({ value: "abc", selectionStart: 1, selectionEnd: 2 });
		expect(history.undo(at("x"))).toEqual({
			value: "abc",
			selectionStart: 1,
			selectionEnd: 2,
		});
	});
});
