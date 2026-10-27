import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ImportRow, ImportRowKind } from "../logic/import-text";
import { TextHistory, type TextSnapshot } from "../logic/text-history";
import styles from "./ImportTextEditor.module.css";

const GUTTER_LABELS: Partial<Record<ImportRowKind, [string, string]>> = {
	background: ["importLyrics.gutter.background", "Background"],
	duet: ["importLyrics.gutter.duet", "Duet"],
	translation: ["importLyrics.gutter.translation", "Translation"],
	romanization: ["importLyrics.gutter.romanization", "Romanization"],
	removedHeader: ["importLyrics.gutter.removed", "Removed"],
};

/**
 * The import text area with a gutter that shows what each row becomes:
 * a section, a background or duet line, a translation, or a dropped header.
 * Rows don't wrap so the gutter stays level with the text.
 */
export function ImportTextEditor({
	value,
	rows,
	onChange,
}: {
	value: string;
	rows: ImportRow[];
	onChange: (value: string) => void;
}) {
	const { t } = useTranslation();
	const gutterRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLTextAreaElement>(null);
	const history = useRef(new TextHistory()).current;
	// The value this editor last saw, to tell its own edits from replacements.
	const knownValue = useRef(value);
	const selection = useRef({ start: value.length, end: value.length });
	const pendingSelection = useRef<TextSnapshot | null>(null);

	const snapshot = (text: string): TextSnapshot => ({
		value: text,
		selectionStart: selection.current.start,
		selectionEnd: selection.current.end,
	});

	// A tool or a fetched song replaced the text: one undo step.
	useLayoutEffect(() => {
		if (value !== knownValue.current) {
			history.recordReplace(snapshot(knownValue.current));
			knownValue.current = value;
		}
		const restore = pendingSelection.current;
		if (restore && textRef.current && value === restore.value) {
			textRef.current.setSelectionRange(
				restore.selectionStart,
				restore.selectionEnd,
			);
			selection.current = {
				start: restore.selectionStart,
				end: restore.selectionEnd,
			};
			pendingSelection.current = null;
		}
	});

	const step = (direction: "undo" | "redo") => {
		const element = textRef.current;
		const current: TextSnapshot = {
			value,
			selectionStart: element?.selectionStart ?? value.length,
			selectionEnd: element?.selectionEnd ?? value.length,
		};
		const target =
			direction === "undo" ? history.undo(current) : history.redo(current);
		if (!target) return;
		knownValue.current = target.value;
		pendingSelection.current = target;
		onChange(target.value);
	};
	const stepRef = useRef(step);
	stepRef.current = step;

	// Undo from the context or Edit menu arrives as beforeinput, not a key.
	useEffect(() => {
		const element = textRef.current;
		if (!element) return;
		const onBeforeInput = (event: InputEvent) => {
			if (event.inputType === "historyUndo") {
				event.preventDefault();
				stepRef.current("undo");
			} else if (event.inputType === "historyRedo") {
				event.preventDefault();
				stepRef.current("redo");
			}
		};
		element.addEventListener("beforeinput", onBeforeInput);
		return () => element.removeEventListener("beforeinput", onBeforeInput);
	}, []);

	return (
		<div className={styles.well}>
			<div className={styles.gutter} ref={gutterRef} aria-hidden>
				<div className={styles.gutterInner}>
					{rows.map((row, index) => {
						const label =
							row.kind === "section"
								? row.category
								: GUTTER_LABELS[row.kind] &&
									t(...(GUTTER_LABELS[row.kind] as [string, string]));
						return (
							<div
								// Rows have no identity beyond their position.
								// biome-ignore lint/suspicious/noArrayIndexKey: see above
								key={index}
								className={styles.mark}
								data-kind={row.kind}
								title={label || undefined}
							>
								{label}
							</div>
						);
					})}
				</div>
			</div>
			<textarea
				ref={textRef}
				className={styles.text}
				value={value}
				wrap="off"
				spellCheck={false}
				onChange={(event) => {
					const next = event.target.value;
					history.recordTyping(
						snapshot(knownValue.current),
						next,
						event.timeStamp,
					);
					knownValue.current = next;
					onChange(next);
				}}
				onSelect={(event) => {
					selection.current = {
						start: event.currentTarget.selectionStart,
						end: event.currentTarget.selectionEnd,
					};
				}}
				onKeyDown={(event) => {
					const mod = event.ctrlKey || event.metaKey;
					if (!mod || event.altKey) return;
					const key = event.key.toLowerCase();
					const redo = key === "y" || (key === "z" && event.shiftKey);
					if (key !== "z" && key !== "y") return;
					// Ours replaces the browser's, which a tool would have wiped anyway.
					event.preventDefault();
					step(redo ? "redo" : "undo");
				}}
				onScroll={(event) => {
					if (gutterRef.current)
						gutterRef.current.scrollTop = event.currentTarget.scrollTop;
				}}
				placeholder={t(
					"importLyrics.textPlaceholder",
					"Paste lyrics here, one line per row. Section headers like [Chorus] go on their own row.",
				)}
				aria-label={t("importLyrics.textLabel", "Lyrics text")}
			/>
		</div>
	);
}
