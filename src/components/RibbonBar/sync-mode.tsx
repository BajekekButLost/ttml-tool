import {
	BackgroundSyncControl,
	SettingToggle,
	SyncLevelControl,
	SyncOffsetControl,
} from "$/modules/settings/components/WorkflowControls";
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
import { showPreviewPanelAtom } from "$/states/main.ts";
import { RibbonFrame, RibbonSection } from "./common";

export const SyncModeRibbonBar = forwardRef<HTMLDivElement>((_props, ref) => {
	const showWordRomanizationInput = useAtomValue(showWordRomanizationInputAtom);
	const { t } = useTranslation();
	const [showAdvanced, setShowAdvanced] = useAtom(advancedRibbonControlsAtom);

	return (
		<RibbonFrame ref={ref}>
			<RibbonSection label={t("ribbonBar.syncMode.syncAdjustment", "Offsets")}>
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
						{t("ribbonBar.syncMode.timeOffset", "Sync offset")}
					</Text>
					<SyncOffsetControl compact />
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.syncMode.commitOffset", "Next key offset")}
					</Text>
					<SyncOffsetControl commit compact />
				</Grid>
			</RibbonSection>
			<RibbonSection label={t("ribbonBar.syncMode.syncLevel", "Sync by")}>
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
						{t("ribbonBar.syncMode.autoScroll", "Auto-scroll")}
					</Text>
					<SettingToggle setting={syncAutoScrollAtom} compact />
					<Text
						wrap="nowrap"
						size="1"
						style={{ color: "var(--ribbon-label-color)" }}
					>
						{t("ribbonBar.syncMode.highlightActiveLine", "Highlight line")}
					</Text>
					<SettingToggle setting={syncActiveLineHighlightAtom} compact />
				</Grid>
			</RibbonSection>
			{showAdvanced && (
				<RibbonSection
					label={t("ribbonBar.syncMode.bgLyricSync", "Background lines")}
				>
					<Flex
						direction="column"
						gap="2"
						align="center"
						justify="center"
						px="2"
						style={{ height: "100%" }}
					>
						<BackgroundSyncControl />
					</Flex>
				</RibbonSection>
			)}
			{showAdvanced && (
				<RibbonSection
					label={t("ribbonBar.syncMode.assistSettings", "Sync aids")}
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
							{t("ribbonBar.syncMode.touchSyncPanel", "Touch sync panel")}
						</Text>
						<SettingToggle setting={showTouchSyncPanelAtom} compact />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t(
								"ribbonBar.syncMode.spectrogramHoverSync",
								"Sync at mouse position",
							)}
						</Text>
						<SettingToggle setting={spectrogramHoverSyncEnabledAtom} compact />
					</Grid>
				</RibbonSection>
			)}
			{showAdvanced && (
				<RibbonSection
					label={t("ribbonBar.syncMode.displayOptions", "Display options")}
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
							{t("ribbonBar.syncMode.showTimestamps", "Show timestamps")}
						</Text>
						<SettingToggle setting={showTimestampsAtom} compact />
						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t(
								"ribbonBar.syncMode.highlightActiveWord",
								"Highlight active word",
							)}
						</Text>
						<SettingToggle setting={highlightActiveWordAtom} compact />

						<Text
							wrap="nowrap"
							size="1"
							style={{ color: "var(--ribbon-label-color)" }}
						>
							{t("ribbonBar.syncMode.highlightErrors", "Highlight errors")}
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
										"Show per-word romanization",
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
			{showAdvanced && (
				<RibbonSection
					label={t("ribbonBar.editMode.previewPanel", "Preview panel")}
				>
					<Flex direction="column" align="center" gap="1">
						<SettingToggle setting={showPreviewPanelAtom} />
					</Flex>
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

export default SyncModeRibbonBar;
