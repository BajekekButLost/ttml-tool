import {
	SettingToggle,
	SyncLevelControl,
	SyncOffsetControl,
} from "$/modules/settings/components/WorkflowControls";
import { backgroundSyncSettingAtom } from "$/modules/settings/states/background-sync";
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

import { Flex, Grid, Switch, Text, Tooltip } from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { advancedRibbonControlsAtom } from "$/modules/onboarding/states";
import {
	displayRomanizationInSyncAtom,
	highlightActiveWordAtom,
	highlightErrorsAtom,
	showTimestampsAtom,
	showWordRomanizationInputAtom,
} from "$/modules/settings/states/index.ts";
import {
	showTouchSyncPanelAtom,
	spectrogramHoverSyncEnabledAtom,
	syncActiveLineHighlightAtom,
	syncAutoScrollAtom,
} from "$/modules/settings/states/sync.ts";
import {
	keySyncEndAtom,
	keySyncNextAtom,
	keySyncStartAtom,
} from "$/states/keybindings.ts";
import { showPreviewPanelAtom } from "$/states/main.ts";
import { KeyBinding } from "../KeyBinding/index.tsx";
import { RibbonFrame, RibbonSection } from "./common";

export const SyncModeRibbonBar = forwardRef<HTMLDivElement>((_props, ref) => {
	const showWordRomanizationInput = useAtomValue(showWordRomanizationInputAtom);
	const { t } = useTranslation();
	const [showAdvanced, setShowAdvanced] = useAtom(advancedRibbonControlsAtom);

	return (
		<RibbonFrame ref={ref}>
			<RibbonSection label={t("ribbonBar.syncMode.syncAdjustment", "打轴调整")}>
				<Grid
					columns="max-content auto"
					gap="4"
					gapY="1"
					flexGrow="1"
					align="center"
				>
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.syncMode.timeOffset", "时间戳位移")}
					</Text>
					<SyncOffsetControl compact />
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.syncMode.commitOffset", "Commit Offset")}
					</Text>
					<SyncOffsetControl commit compact />
				</Grid>
			</RibbonSection>
			<RibbonSection label={t("ribbonBar.syncMode.syncLevel", "Sync Level")}>
				<Flex
					direction="column"
					gap="2"
					align="center"
					justify="center"
					px="2"
					style={{ height: "100%" }}
				>
					<SyncLevelControl />
				</Flex>
			</RibbonSection>
			<RibbonSection
				label={t("ribbonBar.syncMode.playbackTracking", "Tracking")}
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
						{t("ribbonBar.syncMode.autoScroll", "Auto-Scroll")}
					</Text>
					<SettingToggle setting={syncAutoScrollAtom} compact />
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.syncMode.highlightActiveLine", "Highlight Line")}
					</Text>
					<SettingToggle setting={syncActiveLineHighlightAtom} compact />
				</Grid>
			</RibbonSection>
			{showAdvanced && (
				<RibbonSection
					label={t("ribbonBar.syncMode.assistSettings", "辅助设置")}
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
							{t("ribbonBar.syncMode.touchSyncPanel", "触控打轴辅助面板")}
						</Text>
						<SettingToggle setting={showTouchSyncPanelAtom} compact />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.bgLyricIgnoreSync", "背景歌词忽略打轴")}
						</Text>
						<SettingToggle setting={backgroundSyncSettingAtom} compact />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t(
								"ribbonBar.syncMode.spectrogramHoverSync",
								"Sync to Spectrogram Cursor",
							)}
						</Text>
						<SettingToggle setting={spectrogramHoverSyncEnabledAtom} compact />
					</Grid>
				</RibbonSection>
			)}
			{showAdvanced && (
				<RibbonSection
					label={t("ribbonBar.syncMode.displayOptions", "显示选项")}
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
							{t("ribbonBar.syncMode.showTimestamps", "显示时间戳")}
						</Text>
						<SettingToggle setting={showTimestampsAtom} compact />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.highlightActiveWord", "高亮当前音节")}
						</Text>
						<SettingToggle setting={highlightActiveWordAtom} compact />

						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.highlightErrors", "高亮错误")}
						</Text>
						<SettingToggle setting={highlightErrorsAtom} compact />

						{showWordRomanizationInput && (
							<>
								<Text
									wrap="nowrap"
									size="1"
									style={{ color: "var(--ribbon-label-color)" }}
								>
									{t(
										"ribbonBar.syncMode.showPerWordRomanization",
										"显示逐字音译",
									)}
								</Text>
								<SettingToggle
									setting={displayRomanizationInSyncAtom}
									compact
								/>
							</>
						)}
					</Grid>
				</RibbonSection>
			)}
			<RibbonSection
				label={t("ribbonBar.syncMode.keyBindingReference", "打轴键位速查")}
			>
				<Flex gap="4">
					<Grid
						columns="max-content auto"
						gap="4"
						gapY="1"
						flexGrow="1"
						align="center"
						justify="center"
					>
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.startSync", "起始轴")}
						</Text>
						<KeyBinding kbdAtom={keySyncStartAtom} />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.continuousSync", "连续轴")}
						</Text>
						<KeyBinding kbdAtom={keySyncNextAtom} />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.endSync", "结束轴")}
						</Text>
						<KeyBinding kbdAtom={keySyncEndAtom} />
					</Grid>
				</Flex>
			</RibbonSection>
			{showAdvanced && (
				<RibbonSection label={t("ribbonBar.editMode.previewPanel", "预览面板")}>
					<Flex direction="column" align="center" gap="1">
						<SettingToggle setting={showPreviewPanelAtom} />
					</Flex>
				</RibbonSection>
			)}
			<RibbonSection label={t("ribbonBar.advanced", "Advanced")}>
				<Tooltip
					content={t(
						"ribbonBar.advancedTooltip",
						"Applies to all toolbars: Edit, Time, and Preview.",
					)}
				>
					<Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
				</Tooltip>
			</RibbonSection>
		</RibbonFrame>
	);
});

export default SyncModeRibbonBar;
