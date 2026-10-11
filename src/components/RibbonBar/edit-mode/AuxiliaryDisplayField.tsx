import { Grid, Text } from "@radix-ui/themes";
import { type FC, useId } from "react";
import { useTranslation } from "react-i18next";
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
	showLineRomanizationAtom,
	showLineTranslationAtom,
	showWordRomanizationInputAtom,
} from "$/modules/settings/states/index.ts";

export const AuxiliaryDisplayField: FC = () => {
	const { t } = useTranslation();

	const idTranslation = useId();
	const idRomanization = useId();
	const idPerWord = useId();

	return (
		<Grid columns="1fr auto" gapX="4" gapY="1" flexGrow="1" align="center">
			<Text size="1" asChild style={{ color: "var(--ribbon-label-color)" }}>
				<label htmlFor={idTranslation}>
					{t("ribbonBar.editMode.showTranslation", "显示翻译行")}
				</label>
			</Text>
			<SettingToggle
				setting={showLineTranslationAtom}
				compact
				id={idTranslation}
			/>
			<Text size="1" asChild style={{ color: "var(--ribbon-label-color)" }}>
				<label htmlFor={idRomanization}>
					{t("ribbonBar.editMode.showRomanization", "显示音译行")}
				</label>
			</Text>
			<SettingToggle
				setting={showLineRomanizationAtom}
				compact
				id={idRomanization}
			/>
			<Text size="1" asChild style={{ color: "var(--ribbon-label-color)" }}>
				<label htmlFor={idPerWord}>
					{t("ribbonBar.editMode.showWordRomanizationInput", "显示逐字音译")}
				</label>
			</Text>
			<SettingToggle
				setting={showWordRomanizationInputAtom}
				compact
				id={idPerWord}
			/>
		</Grid>
	);
};
