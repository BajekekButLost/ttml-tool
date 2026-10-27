import {
	ArrowUndoRegular,
	ChevronRightRegular,
	SparkleRegular,
	TextWordCountRegular,
} from "@fluentui/react-icons";
import {
	Button,
	Checkbox,
	Flex,
	Select,
	Switch,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useAtom } from "jotai";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { OptionPicker } from "$/components/OptionPicker";
import type {
	ImportContentMode,
	ImportLineSeparatorMode,
} from "../logic/import-text";
import {
	bgLyricPrefixAtom,
	duetLyricPrefixAtom,
	enableSpecialPrefixAtom,
	fetchImportedSongwritersAtom,
	importModeAtom,
	lineSeparatorAtom,
	lineSeparatorModeAtom,
	makeSectionsOnImportAtom,
	swapTransAndRomanAtom,
	wordSeparatorAtom,
} from "../states";
import styles from "./ImportOptionsPanel.module.css";

function Group({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Flex direction="column" gap="2" className={styles.group}>
			<Text size="2" weight="medium">
				{title}
			</Text>
			{children}
		</Flex>
	);
}

function Hint({ id, children }: { id?: string; children: ReactNode }) {
	return (
		<Text id={id} size="1" className={styles.hint}>
			{children}
		</Text>
	);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className={styles.row}>
			<Text size="2" color="gray">
				{label}
			</Text>
			{children}
		</label>
	);
}

export function ImportOptionsPanel({
	headerCount,
	hasText,
	canRestore,
	canSplit,
	showSongwriters,
	onProcess,
	onSplit,
	onRestore,
}: {
	headerCount: number;
	hasText: boolean;
	canRestore: boolean;
	canSplit: boolean;
	showSongwriters: boolean;
	onProcess: () => void;
	onSplit: () => void;
	onRestore: () => void;
}) {
	const { t } = useTranslation();
	const processHintId = useId();
	const splitHintId = useId();
	const [makeSections, setMakeSections] = useAtom(makeSectionsOnImportAtom);
	const [fetchSongwriters, setFetchSongwriters] = useAtom(
		fetchImportedSongwritersAtom,
	);
	const [formatOpen, setFormatOpen] = useState(false);

	return (
		<Flex direction="column" gap="4">
			<Group title={t("importLyrics.prepareTitle", "Clean up")}>
				<Button
					variant="soft"
					onClick={onProcess}
					disabled={!hasText}
					aria-describedby={processHintId}
				>
					<SparkleRegular />
					{t("textImportDialog.processLyrics", "Process lyrics")}
				</Button>
				<Hint id={processHintId}>
					{t(
						"importLyrics.processHint",
						"Splits words, tidies punctuation and spacing, and moves parenthesized vocals to background lines.",
					)}
				</Hint>
				<Button
					variant="soft"
					onClick={onSplit}
					disabled={!canSplit}
					aria-describedby={splitHintId}
				>
					<TextWordCountRegular />
					{t("importLyrics.splitSyllables", "Split syllables")}
				</Button>
				<Hint id={splitHintId}>
					{t(
						"importLyrics.splitHint",
						"Marks syllables with the word separator, using your Auto segment settings and learned splits. Fix any marks in the text before importing.",
					)}
				</Hint>
				{canRestore && (
					<Button variant="ghost" color="gray" onClick={onRestore}>
						<ArrowUndoRegular />
						{t("importLyrics.restoreOriginal", "Restore original text")}
					</Button>
				)}
			</Group>

			{headerCount > 0 && (
				<Group title={t("importLyrics.sectionsTitle", "Section headers")}>
					<Hint>
						{t(
							"importLyrics.sectionsFound",
							"{count, plural, one {# header found} other {# headers found}}",
							{ count: headerCount },
						)}
					</Hint>
					<OptionPicker
						variant="segmented"
						fullWidth
						label={t("importLyrics.sectionsTitle", "Section headers")}
						value={makeSections ? "sections" : "remove"}
						onValueChange={(value) => setMakeSections(value === "sections")}
						options={[
							{
								value: "sections",
								label: t("importLyrics.makeSections", "Make sections"),
								description: t(
									"importLyrics.makeSectionsHint",
									"Each header starts a section. Turns on Genius sections.",
								),
							},
							{
								value: "remove",
								label: t("importLyrics.removeHeaders", "Remove"),
								description: t(
									"importLyrics.removeHeadersHint",
									"Drops the header rows from the lyrics.",
								),
							},
						]}
					/>
					<Hint>
						{makeSections
							? t(
									"importLyrics.makeSectionsHint",
									"Each header starts a section. Turns on Genius sections.",
								)
							: t(
									"importLyrics.removeHeadersHint",
									"Drops the header rows from the lyrics.",
								)}
					</Hint>
				</Group>
			)}

			{showSongwriters && (
				<Text as="label" size="2">
					<Flex gap="2" align="center">
						<Checkbox
							checked={fetchSongwriters}
							onCheckedChange={(checked) =>
								setFetchSongwriters(checked === true)
							}
						/>
						{t(
							"metadataDialog.fetchSongwriters.button",
							"Fetch songwriters from Genius",
						)}
					</Flex>
				</Text>
			)}

			<Flex direction="column" gap="2" className={styles.group}>
				<button
					type="button"
					className={styles.disclosure}
					aria-expanded={formatOpen}
					onClick={() => setFormatOpen(!formatOpen)}
				>
					<ChevronRightRegular className={styles.chevron} />
					<Text size="2" weight="medium">
						{t("importLyrics.textFormat", "Text format")}
					</Text>
				</button>
				{formatOpen && <TextFormatFields />}
			</Flex>
		</Flex>
	);
}

function TextFormatFields() {
	const { t } = useTranslation();
	const [importMode, setImportMode] = useAtom(importModeAtom);
	const [lineSeparatorMode, setLineSeparatorMode] = useAtom(
		lineSeparatorModeAtom,
	);
	const [lineSeparator, setLineSeparator] = useAtom(lineSeparatorAtom);
	const [swapTransAndRoman, setSwapTransAndRoman] = useAtom(
		swapTransAndRomanAtom,
	);
	const [wordSeparator, setWordSeparator] = useAtom(wordSeparatorAtom);
	const [enableSpecialPrefix, setEnableSpecialPrefix] = useAtom(
		enableSpecialPrefixAtom,
	);
	const [bgLyricPrefix, setBgLyricPrefix] = useAtom(bgLyricPrefixAtom);
	const [duetLyricPrefix, setDuetLyricPrefix] = useAtom(duetLyricPrefixAtom);
	const lyricOnly = importMode === "lyric";

	return (
		<Flex direction="column" gap="2">
			<Flex direction="column" gap="1">
				<Text size="2" color="gray">
					{t("textImportDialog.contentMode.caption", "Text content")}
				</Text>
				<Select.Root
					value={importMode}
					onValueChange={(value) => setImportMode(value as ImportContentMode)}
				>
					<Select.Trigger
						aria-label={t(
							"textImportDialog.contentMode.caption",
							"Text content",
						)}
					/>
					<Select.Content>
						<Select.Item value="lyric">
							{t("textImportDialog.contentMode.lyric", "Lyrics only")}
						</Select.Item>
						<Select.Item value="lyric-trans">
							{t(
								"textImportDialog.contentMode.withTranslation",
								"Lyrics with translation",
							)}
						</Select.Item>
						<Select.Item value="lyric-roman">
							{t(
								"textImportDialog.contentMode.withRoman",
								"Lyrics with romanization",
							)}
						</Select.Item>
						<Select.Item value="lyric-trans-roman">
							{t(
								"textImportDialog.contentMode.withBoth",
								"Lyrics with translation and romanization",
							)}
						</Select.Item>
					</Select.Content>
				</Select.Root>
			</Flex>
			{!lyricOnly && (
				<>
					<Flex direction="column" gap="1">
						<Text size="2" color="gray">
							{t(
								"textImportDialog.separationMode.caption",
								"Translation and romanization layout",
							)}
						</Text>
						<Select.Root
							value={lineSeparatorMode}
							onValueChange={(value) =>
								setLineSeparatorMode(value as ImportLineSeparatorMode)
							}
						>
							<Select.Trigger
								aria-label={t(
									"textImportDialog.separationMode.caption",
									"Translation and romanization layout",
								)}
							/>
							<Select.Content>
								<Select.Item value="interleaved-line">
									{t(
										"textImportDialog.separationMode.multipleLine",
										"On separate lines",
									)}
								</Select.Item>
								<Select.Item value="same-line-separator">
									{t(
										"textImportDialog.separationMode.sameLine",
										"On the same line",
									)}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</Flex>
					{lineSeparatorMode === "same-line-separator" && (
						<Row label={t("textImportDialog.separator", "Line separator")}>
							<TextField.Root
								className={styles.shortField}
								value={lineSeparator}
								onChange={(event) =>
									setLineSeparator(event.currentTarget.value)
								}
							/>
						</Row>
					)}
					<Row
						label={t(
							"textImportDialog.swapTransAndRoman",
							"Swap translation and romanization lines",
						)}
					>
						<Switch
							checked={swapTransAndRoman}
							onCheckedChange={setSwapTransAndRoman}
						/>
					</Row>
				</>
			)}
			<Row label={t("textImportDialog.wordSeparator", "Word separator")}>
				<TextField.Root
					className={styles.shortField}
					value={wordSeparator}
					onChange={(event) => setWordSeparator(event.currentTarget.value)}
				/>
			</Row>
			<Row
				label={t("textImportDialog.enableSpecialPrefix", "Use line prefixes")}
			>
				<Switch
					checked={enableSpecialPrefix}
					onCheckedChange={setEnableSpecialPrefix}
				/>
			</Row>
			{enableSpecialPrefix && (
				<>
					<Row
						label={t(
							"textImportDialog.bgLyricPrefix",
							"Background line prefix",
						)}
					>
						<TextField.Root
							className={styles.shortField}
							value={bgLyricPrefix}
							onChange={(event) => setBgLyricPrefix(event.currentTarget.value)}
						/>
					</Row>
					<Row
						label={t("textImportDialog.duetLyricPrefix", "Duet line prefix")}
					>
						<TextField.Root
							className={styles.shortField}
							value={duetLyricPrefix}
							onChange={(event) =>
								setDuetLyricPrefix(event.currentTarget.value)
							}
						/>
					</Row>
				</>
			)}
		</Flex>
	);
}
