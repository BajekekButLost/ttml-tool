import { Button, Grid, Switch, Text, Tooltip } from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { advancedRibbonControlsAtom } from "$/modules/onboarding/states";
import { SettingToggle } from "$/modules/settings/components/WorkflowControls";
/*
 * Copyright 2023-2025 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL/blob/main/LICENSE
 */

import {
	editActiveLineHighlightAtom,
	editAutoScrollAtom,
} from "$/modules/settings/states/sync.ts";
import {
	lyricLinesAtom,
	selectedLinesAtom,
	selectedWordsAtom,
} from "$/states/main.ts";
import { newLyricLine } from "$/types/ttml";
import { msToTimestamp, parseTimespan } from "$/utils/timestamp.ts";
import { RibbonFrame, RibbonSection } from "./common";
import { AuxiliaryDisplayField } from "./edit-mode/AuxiliaryDisplayField";
import { PhoneticSection } from "./edit-mode/PhoneticSection";
import { CheckboxField } from "./fields/CheckboxField";
import { EditField } from "./fields/EditField";

export const EditModeRibbonBar = forwardRef<HTMLDivElement>((_props, ref) => {
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const { t } = useTranslation();
	const selectedLines = useAtomValue(selectedLinesAtom);
	const selectedWords = useAtomValue(selectedWordsAtom);
	const [showAdvanced, setShowAdvanced] = useAtom(advancedRibbonControlsAtom);

	return (
		<RibbonFrame ref={ref} reserveControlRows={3}>
			<RibbonSection label={t("ribbonBar.editMode.new", "新建")}>
				<Grid columns="1" gap="1" gapY="1" flexGrow="1" align="center">
					<Button
						size="1"
						variant="soft"
						onClick={() =>
							editLyricLines((draft) => {
								draft.lyricLines.push(newLyricLine());
							})
						}
					>
						{t("ribbonBar.editMode.lyricLine", "Lyric line")}
					</Button>
				</Grid>
			</RibbonSection>
			<RibbonSection
				label={t("ribbonBar.editMode.playbackTracking", "Tracking")}
			>
				<Grid
					columns="max-content auto"
					gap="2"
					gapY="1"
					flexGrow="1"
					align="center"
				>
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.editMode.autoScroll", "Auto-scroll")}
					</Text>
					<SettingToggle setting={editAutoScrollAtom} compact />
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.editMode.highlightActiveLine", "Highlight line")}
					</Text>
					<SettingToggle setting={editActiveLineHighlightAtom} compact />
				</Grid>
			</RibbonSection>
			{selectedLines.size > 0 && (
				<RibbonSection
					label={t("ribbonBar.editMode.lineTiming", "Line timing")}
				>
					<Grid
						columns="max-content 1fr"
						gap="2"
						gapY="1"
						flexGrow="1"
						align="center"
					>
						<EditField
							label={t("ribbonBar.editMode.startTime", "起始时间")}
							fieldName="startTime"
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label={t("ribbonBar.editMode.endTime", "结束时间")}
							fieldName="endTime"
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
					</Grid>
				</RibbonSection>
			)}
			{selectedLines.size > 0 && (
				<RibbonSection
					label={t("ribbonBar.editMode.lineProperties", "Line properties")}
				>
					<Grid
						columns="max-content max-content"
						gap="4"
						gapY="1"
						flexGrow="1"
						align="center"
					>
						<CheckboxField
							label={t("ribbonBar.editMode.bgLyric", "Background vocal")}
							defaultValue={false}
							isWordField={false}
							fieldName="isBG"
						/>
						<CheckboxField
							label={t("ribbonBar.editMode.duetLyric", "Duet vocal")}
							isWordField={false}
							fieldName="isDuet"
							defaultValue={false}
						/>
						<CheckboxField
							label={t("ribbonBar.editMode.ignoreSync", "Skip when syncing")}
							isWordField={false}
							fieldName="ignoreSync"
							defaultValue={false}
						/>
					</Grid>
				</RibbonSection>
			)}
			{showAdvanced && (selectedLines.size > 0 || selectedWords.size > 0) && (
				<PhoneticSection />
			)}
			{selectedWords.size > 0 && (
				<RibbonSection
					label={t("ribbonBar.editMode.wordTiming", "Word timing")}
				>
					<Grid
						columns="max-content 1fr"
						gap="2"
						gapY="1"
						flexGrow="1"
						align="center"
					>
						<EditField
							label={t("ribbonBar.editMode.startTime", "起始时间")}
							fieldName="startTime"
							isWordField
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label={t("ribbonBar.editMode.endTime", "结束时间")}
							fieldName="endTime"
							isWordField
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
					</Grid>
				</RibbonSection>
			)}
			{selectedWords.size > 0 && (
				<RibbonSection
					label={t("ribbonBar.editMode.wordProperties", "Word properties")}
				>
					<Grid
						columns="max-content 1fr"
						gap="2"
						gapY="1"
						flexGrow="1"
						align="center"
					>
						<EditField
							label={t("ribbonBar.editMode.wordContent", "Word content")}
							fieldName="word"
							isWordField
							parser={(v) => v}
							formatter={(v) => v}
						/>
						<EditField
							label={t("ribbonBar.editMode.romanWord", "Word romanization")}
							fieldName="romanWord"
							isWordField
							parser={(v) => v}
							formatter={(v) => v || ""}
						/>
					</Grid>
				</RibbonSection>
			)}
			{showAdvanced && selectedLines.size > 0 && (
				<RibbonSection
					label={t("ribbonBar.editMode.secondaryContent", "Secondary content")}
				>
					<Grid
						columns="max-content 1fr"
						gap="2"
						gapY="1"
						flexGrow="1"
						align="center"
					>
						<EditField
							label={t("ribbonBar.editMode.translatedLyric", "翻译歌词")}
							fieldName="translatedLyric"
							parser={(v) => v}
							formatter={(v) => v}
							textFieldStyle={{ width: "15em" }}
						/>
						<EditField
							label={t("ribbonBar.editMode.romanLyric", "音译歌词")}
							fieldName="romanLyric"
							parser={(v) => v}
							formatter={(v) => v}
							textFieldStyle={{ width: "15em" }}
						/>
					</Grid>
				</RibbonSection>
			)}
			{showAdvanced && (
				<RibbonSection
					label={t(
						"ribbonBar.editMode.auxiliaryLineDisplay",
						"Auxiliary line display",
					)}
				>
					<AuxiliaryDisplayField />
				</RibbonSection>
			)}
			<RibbonSection label={t("ribbonBar.advanced", "Advanced")}>
				<Tooltip
					content={t(
						"ribbonBar.advancedTooltip",
						"Applies to the Edit, Time and Preview ribbons.",
					)}
				>
					<Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
				</Tooltip>
			</RibbonSection>
		</RibbonFrame>
	);
});

export default EditModeRibbonBar;
