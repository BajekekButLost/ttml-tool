import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ImportRow, ImportRowKind } from "../logic/import-text";
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
				className={styles.text}
				value={value}
				wrap="off"
				spellCheck={false}
				onChange={(event) => onChange(event.target.value)}
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
