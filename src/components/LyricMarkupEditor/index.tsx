import { isolateHistory } from "@codemirror/commands";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, placeholder as placeholderText } from "@codemirror/view";
import {
	PeopleRegular,
	PersonVoiceRegular,
	TextWordCountRegular,
} from "@fluentui/react-icons";
import {
	Button,
	Flex,
	IconButton,
	Popover,
	Select,
	Text,
	TextField,
} from "@radix-ui/themes";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	LYRIC_SECTION_CATEGORIES,
	type LyricSectionCategory,
} from "$/types/ttml";
import {
	callbacksFacet,
	formatFacet,
	type LyricMarkupLabels,
	labelsFacet,
	lyricMarkupExtensions,
	markupField,
	splitOrJoin,
	toggleLinePrefix,
} from "./extensions";
import styles from "./index.module.css";
import {
	headerWithCategory,
	type LyricMarkupFormat,
	normalizeHeaderCategory,
} from "./markup";
import { lineChanges } from "./text-changes";

export type { LyricMarkupFormat } from "./markup";

/**
 * Rewrites the text as one undo step. Only the lines that differ are touched,
 * so the editor keeps the line at the top of the view, and the cursor, where
 * they were.
 */
function replaceInPlace(
	view: EditorView,
	before: string,
	after: string,
	userEvent?: string,
) {
	const changes = view.state.changes(lineChanges(before, after));
	view.dispatch({
		changes,
		// Redrawing the cursor's line would otherwise let the browser scroll to
		// it; this puts the line that was at the top back at the top.
		effects: view.scrollSnapshot().map(changes),
		annotations: [Transaction.addToHistory.of(true), isolateHistory.of("full")],
		userEvent,
	});
}

/** Lines a tool works on, 0-based and inclusive, or null for the whole text. */
export type LyricMarkupLineRange = { from: number; to: number } | null;

/** A text-wide action in the toolbar, run on the selected lines or everything. */
export interface LyricMarkupTool {
	key: string;
	icon: ReactNode;
	label: string;
	disabled?: boolean;
	run: (text: string, lines: LyricMarkupLineRange) => string;
}

/**
 * A plain-text lyric editor that draws its markup as it goes: section headers
 * as pills, background and duet lines styled by role, syllable splits as dots,
 * and translation rows attached to their lyric. The line the cursor is on shows
 * its raw symbols. The value is always the plain text.
 */
export function LyricMarkupEditor({
	value,
	onChange,
	format,
	ariaLabel,
	placeholder,
	tools,
}: {
	value: string;
	onChange: (value: string) => void;
	format: LyricMarkupFormat;
	ariaLabel: string;
	placeholder?: string;
	tools?: LyricMarkupTool[];
}) {
	const { t } = useTranslation();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const parentRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const knownValue = useRef(value);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const compartments = useRef({
		format: new Compartment(),
		labels: new Compartment(),
		attributes: new Compartment(),
	}).current;
	const [menu, setMenu] = useState<{ line: number; rect: DOMRect } | null>(
		null,
	);
	const callbacks = useRef({
		openHeaderMenu: (line: number, rect: DOMRect) => setMenu({ line, rect }),
	}).current;

	const labels = useMemo<LyricMarkupLabels>(
		() => ({
			section: (label) =>
				t("lyricMarkup.section", "Section: {label}", { label }),
			joinSyllables: t("lyricMarkup.joinSyllables", "Join syllables"),
			background: t("lyricMarkup.gutter.background", "Background"),
			duet: t("lyricMarkup.gutter.duet", "Duet"),
			translation: t("lyricMarkup.gutter.translation", "Translation"),
			romanization: t("lyricMarkup.gutter.romanization", "Romanization"),
			removed: t("lyricMarkup.gutter.removed", "Removed"),
			dropped: t("lyricMarkup.gutter.dropped", "Not imported"),
			missingTranslation: t(
				"lyricMarkup.gutter.missingTranslation",
				"Missing translation",
			),
			missingRomanization: t(
				"lyricMarkup.gutter.missingRomanization",
				"Missing romanization",
			),
		}),
		[t],
	);
	const attributes = useMemo(
		() => [
			EditorView.contentAttributes.of({
				"aria-label": ariaLabel,
				"aria-multiline": "true",
				spellcheck: "false",
			}),
			...(placeholder ? [placeholderText(placeholder)] : []),
		],
		[ariaLabel, placeholder],
	);

	// The view is created once; format, labels and attributes are swapped in below.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		if (!parentRef.current) return;
		const view = new EditorView({
			parent: parentRef.current,
			state: EditorState.create({
				doc: value,
				extensions: [
					compartments.format.of(formatFacet.of(format)),
					compartments.labels.of(labelsFacet.of(labels)),
					compartments.attributes.of(attributes),
					callbacksFacet.of(callbacks),
					lyricMarkupExtensions,
					EditorView.updateListener.of((update) => {
						if (!update.docChanged) return;
						const text = update.state.doc.toString();
						knownValue.current = text;
						onChangeRef.current(text);
					}),
				],
			}),
		});
		viewRef.current = view;
		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, []);

	useEffect(() => {
		viewRef.current?.dispatch({
			effects: compartments.format.reconfigure(formatFacet.of(format)),
		});
	}, [format, compartments]);
	useEffect(() => {
		viewRef.current?.dispatch({
			effects: compartments.labels.reconfigure(labelsFacet.of(labels)),
		});
	}, [labels, compartments]);
	useEffect(() => {
		viewRef.current?.dispatch({
			effects: compartments.attributes.reconfigure(attributes),
		});
	}, [attributes, compartments]);

	// A tool or a fetched song replaced the text: one undo step of its own.
	useEffect(() => {
		const view = viewRef.current;
		if (!view || value === knownValue.current) return;
		knownValue.current = value;
		replaceInPlace(view, view.state.doc.toString(), value);
	}, [value]);

	const run = (command: (view: EditorView) => boolean) => {
		const view = viewRef.current;
		if (!view) return;
		command(view);
		view.focus();
	};

	// Runs on the lines the selection touches, or the whole text without one.
	// The rewrite is one undo step.
	const runTool = (tool: LyricMarkupTool) => {
		const view = viewRef.current;
		if (!view) return;
		const { doc, selection } = view.state;
		const { from, to, empty } = selection.main;
		const first = doc.lineAt(from).number - 1;
		const last = doc.lineAt(to).number - 1;
		// A selection ending at the start of a line doesn't pick that line.
		const end = last > first && doc.lineAt(to).from === to ? last - 1 : last;
		const before = doc.toString();
		const after = tool.run(before, empty ? null : { from: first, to: end });
		if (after !== before) replaceInPlace(view, before, after, "input.tool");
		// A plain focus() would scroll the cursor into view.
		view.contentDOM.focus({ preventScroll: true });
	};

	// The header the open menu edits, read fresh from the document.
	const header = (() => {
		const view = viewRef.current;
		if (!menu || !view || menu.line >= view.state.doc.lines) return null;
		const line = view.state.doc.line(menu.line + 1);
		const span = view.state
			.field(markupField)
			[menu.line]?.spans.find((item) => item.type === "header");
		if (!span) return null;
		const from = line.from + span.from;
		const to = line.from + span.to;
		return { from, to, text: view.state.sliceDoc(from, to) };
	})();
	const replaceHeader = (text: string) => {
		const view = viewRef.current;
		if (!view || !header) return;
		view.dispatch({
			changes: { from: header.from, to: header.to, insert: text },
			userEvent: "input.header",
		});
	};
	const wrapperRect = wrapperRef.current?.getBoundingClientRect();
	const prefixesOn = format.enableSpecialPrefix;

	return (
		<div className={styles.root} ref={wrapperRef}>
			<Flex
				className={styles.toolbar}
				gap="1"
				align="center"
				role="toolbar"
				aria-label={t("lyricMarkup.toolbar", "Line tools")}
			>
				<IconButton
					size="1"
					variant="ghost"
					color="gray"
					disabled={!prefixesOn || !format.bgLyricPrefix}
					aria-label={t("lyricMarkup.background", "Background line")}
					title={`${t("lyricMarkup.background", "Background line")} (Alt+B)`}
					onClick={() => run(toggleLinePrefix("background"))}
				>
					<PersonVoiceRegular />
				</IconButton>
				<IconButton
					size="1"
					variant="ghost"
					color="gray"
					disabled={!prefixesOn || !format.duetLyricPrefix}
					aria-label={t("lyricMarkup.duet", "Duet line")}
					title={`${t("lyricMarkup.duet", "Duet line")} (Alt+D)`}
					onClick={() => run(toggleLinePrefix("duet"))}
				>
					<PeopleRegular />
				</IconButton>
				<IconButton
					size="1"
					variant="ghost"
					color="gray"
					disabled={!format.wordSeparator}
					aria-label={t("lyricMarkup.split", "Split or join syllable")}
					title={`${t("lyricMarkup.split", "Split or join syllable")} (Alt+S)`}
					onClick={() => run(splitOrJoin)}
				>
					<TextWordCountRegular />
				</IconButton>
				<Text size="1" className={styles.hint}>
					{t(
						"lyricMarkup.hint",
						"Alt+click between letters to split, click a dot to join. Alt+C changes a section.",
					)}
				</Text>
				{tools && tools.length > 0 && (
					<Flex gap="1" align="center" className={styles.tools}>
						{tools.map((tool) => (
							<Button
								key={tool.key}
								size="1"
								variant="ghost"
								color="gray"
								disabled={tool.disabled}
								// Keeps focus, and the scroll position, in the editor.
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => runTool(tool)}
							>
								{tool.icon}
								{tool.label}
							</Button>
						))}
					</Flex>
				)}
			</Flex>
			<div className={styles.editor} ref={parentRef} />

			<Popover.Root
				open={!!menu && !!header}
				onOpenChange={(open) => {
					if (open) return;
					setMenu(null);
					viewRef.current?.focus();
				}}
			>
				{/* Always mounted so the popover can measure it before opening.
				    The themed Anchor drops its children, so it carries the box itself. */}
				<Popover.Anchor
					className={styles.anchor}
					style={
						menu && wrapperRect
							? {
									left: menu.rect.left - wrapperRect.left,
									top: menu.rect.top - wrapperRect.top,
									width: menu.rect.width,
									height: menu.rect.height,
								}
							: { left: 0, top: 0, width: 0, height: 0 }
					}
				/>
				<Popover.Content size="1" align="start" className={styles.menu}>
					{header && (
						<Flex direction="column" gap="2">
							<Text as="label" size="1" weight="medium">
								{t("lyricMarkup.headerText", "Header text")}
								<TextField.Root
									size="1"
									mt="1"
									value={header.text.slice(1, -1)}
									onChange={(event) => replaceHeader(`[${event.target.value}]`)}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											setMenu(null);
											viewRef.current?.focus();
										}
									}}
								/>
							</Text>
							<Flex direction="column" gap="1">
								<Text size="1" weight="medium">
									{t("lyricMarkup.category", "Category")}
								</Text>
								<Select.Root
									size="1"
									value={normalizeHeaderCategory(header.text)}
									onValueChange={(category) =>
										replaceHeader(
											headerWithCategory(
												header.text,
												category as LyricSectionCategory,
											),
										)
									}
								>
									<Select.Trigger
										aria-label={t("lyricMarkup.category", "Category")}
									/>
									<Select.Content>
										{LYRIC_SECTION_CATEGORIES.map((category) => (
											<Select.Item key={category} value={category}>
												{category}
											</Select.Item>
										))}
									</Select.Content>
								</Select.Root>
							</Flex>
						</Flex>
					)}
				</Popover.Content>
			</Popover.Root>
		</div>
	);
}
