import {
	PreviewModeControl,
	SettingToggle,
	SpicyBackgroundControl,
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

import { Grid, Switch, Text, Tooltip } from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { advancedRibbonControlsAtom } from "$/modules/onboarding/states";
import {
	PreviewModeType,
	previewModeTypeAtom,
	showRomanLinesAtom,
	showTranslationLinesAtom,
	spicyForceLineSyncedAtom,
	spicySimpleLyricsModeAtom,
} from "$/modules/settings/states/preview";
import { timingOverviewAutoScrollAtom } from "$/modules/settings/states/sync.ts";
import { RibbonFrame, RibbonSection } from "./common";

export const PreviewModeRibbonBar = forwardRef<HTMLDivElement>(
	(_props, ref) => {
		const previewModeType = useAtomValue(previewModeTypeAtom);
		const { t } = useTranslation();
		const [showAdvanced, setShowAdvanced] = useAtom(advancedRibbonControlsAtom);

		return (
			<RibbonFrame ref={ref}>
				<RibbonSection label={t("ribbonBar.previewMode.mode", "模式")}>
					<PreviewModeControl />
				</RibbonSection>
				{previewModeType === PreviewModeType.Spicy && (
					<RibbonSection label={t("ribbonBar.previewMode.spicy", "Spicy")}>
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
								{t("ribbonBar.previewMode.simpleLyrics", "Simple lyrics")}
							</Text>
							<SettingToggle setting={spicySimpleLyricsModeAtom} compact />
							<Text
								wrap="nowrap"
								size="1"
								style={{ color: "var(--ribbon-label-color)" }}
							>
								{t(
									"ribbonBar.previewMode.forceLineRendering",
									"Force line rendering",
								)}
							</Text>
							<SettingToggle setting={spicyForceLineSyncedAtom} compact />
							<Text
								wrap="nowrap"
								size="1"
								style={{ color: "var(--ribbon-label-color)" }}
							>
								{t("ribbonBar.previewMode.background", "Background")}
							</Text>
							<SpicyBackgroundControl />
						</Grid>
					</RibbonSection>
				)}
				{previewModeType === PreviewModeType.Timing && (
					<RibbonSection label={t("ribbonBar.previewMode.timing", "时轴")}>
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
								{t("ribbonBar.previewMode.autoScroll", "Auto-Scroll")}
							</Text>
							<SettingToggle setting={timingOverviewAutoScrollAtom} compact />
						</Grid>
					</RibbonSection>
				)}
				{previewModeType !== PreviewModeType.Timing && (
					<RibbonSection label={t("ribbonBar.previewMode.lyrics", "歌词")}>
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
								{t("ribbonBar.previewMode.showTranslation", "显示翻译")}
							</Text>
							<SettingToggle setting={showTranslationLinesAtom} compact />
							<Text
								wrap="nowrap"
								size="1"
								style={{ color: "var(--ribbon-label-color)" }}
							>
								{t("ribbonBar.previewMode.showRoman", "显示音译")}
							</Text>
							<SettingToggle setting={showRomanLinesAtom} compact />
						</Grid>
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
	},
);

export default PreviewModeRibbonBar;
