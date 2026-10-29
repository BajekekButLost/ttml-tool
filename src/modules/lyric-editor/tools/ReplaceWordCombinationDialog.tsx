import {
	Button,
	Checkbox,
	Dialog,
	Flex,
	Grid,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useAtom } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import { memo, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { replaceWordCombinationDialogAtom } from "$/states/dialogs";
import { lyricLinesAtom } from "$/states/main";
import {
	replaceWordCombination,
	type WordCombinationSelection,
} from "./replace-word-combination";

function ReplacementForm({
	selection,
	close,
}: {
	selection: WordCombinationSelection;
	close: () => void;
}) {
	const { t } = useTranslation();
	const fieldId = useId();
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const [replacements, setReplacements] = useState(() =>
		selection.words.map(({ word }) => word),
	);
	const [applyToAll, setApplyToAll] = useState(false);
	const [caseSensitive, setCaseSensitive] = useState(true);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				editLyricLines((state) => {
					replaceWordCombination(
						state.lyricLines,
						selection,
						replacements,
						applyToAll,
						caseSensitive,
					);
				});
				close();
			}}
		>
			<Flex direction="column" gap="3">
				{selection.words.map((word, index) => (
					<Grid
						key={word.id}
						columns="minmax(0, 1fr) minmax(0, 1fr)"
						gap="3"
						align="center"
					>
						<Text as="label" htmlFor={`${fieldId}-${index}`} size="2">
							<Text
								as="span"
								size="1"
								color="gray"
								style={{ display: "block" }}
							>
								{t("replaceWordCombinationDialog.word", {
									index: index + 1,
									defaultValue: "Word {index}",
								})}
							</Text>
							<Text
								as="span"
								style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
							>
								{word.word}
							</Text>
						</Text>
						<TextField.Root
							id={`${fieldId}-${index}`}
							value={replacements[index]}
							onChange={(event) => {
								const value = event.currentTarget.value;
								setReplacements((current) =>
									current.map((text, offset) =>
										offset === index ? value : text,
									),
								);
							}}
							placeholder={t("replaceWordDialog.placeholder", "New word")}
							autoFocus={index === 0}
						/>
					</Grid>
				))}
				<Flex direction="column" gap="2">
					<Text as="label" size="2">
						<Flex gap="2" align="center">
							<Checkbox
								checked={applyToAll}
								onCheckedChange={(checked) => setApplyToAll(checked === true)}
							/>
							{t(
								"replaceWordCombinationDialog.applyToAll",
								"Replace all matching combinations",
							)}
						</Flex>
					</Text>
					<Text as="label" size="2" color={applyToAll ? undefined : "gray"}>
						<Flex gap="2" align="center">
							<Checkbox
								checked={caseSensitive}
								onCheckedChange={(checked) =>
									setCaseSensitive(checked === true)
								}
								disabled={!applyToAll}
							/>
							{t("replaceWordDialog.caseSensitive", "Match case")}
						</Flex>
					</Text>
				</Flex>
			</Flex>
			<Flex gap="3" mt="4" justify="end" wrap="wrap">
				<Dialog.Close>
					<Button type="button" variant="soft" color="gray">
						{t("common.cancel", "Cancel")}
					</Button>
				</Dialog.Close>
				<Button type="submit">{t("common.confirm", "Confirm")}</Button>
			</Flex>
		</form>
	);
}

export const ReplaceWordCombinationDialog = memo(() => {
	const { t } = useTranslation();
	const [dialog, setDialog] = useAtom(replaceWordCombinationDialogAtom);
	const close = () => setDialog({ open: false, selection: null });

	return (
		<Dialog.Root
			open={dialog.open}
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<Dialog.Content maxWidth="460px">
				<Dialog.Title>
					{t("replaceWordCombinationDialog.title", "Replace word combination")}
				</Dialog.Title>
				<Dialog.Description size="2" mb="4">
					{dialog.selection
						? t(
								"replaceWordCombinationDialog.description",
								"Edit each selected word or syllable. Timing stays the same.",
							)
						: t(
								"replaceWordCombinationDialog.adjacentOnly",
								"Select adjacent words or syllables in one line to replace a combination.",
							)}
				</Dialog.Description>
				{dialog.open && dialog.selection ? (
					<ReplacementForm selection={dialog.selection} close={close} />
				) : (
					<Flex justify="end">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								{t("common.cancel", "Cancel")}
							</Button>
						</Dialog.Close>
					</Flex>
				)}
			</Dialog.Content>
		</Dialog.Root>
	);
});
