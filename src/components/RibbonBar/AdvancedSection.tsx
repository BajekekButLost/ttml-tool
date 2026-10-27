import { Switch, Tooltip } from "@radix-ui/themes";
import { useAtom } from "jotai";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { advancedRibbonControlsAtom } from "$/modules/onboarding/states";
import { RibbonSection } from "./common";

/** The Advanced switch shared by the Edit, Time and Preview ribbons. */
export const AdvancedSection: FC = () => {
	const { t } = useTranslation();
	const [showAdvanced, setShowAdvanced] = useAtom(advancedRibbonControlsAtom);
	const label = t("ribbonBar.advanced", "Advanced");

	return (
		<RibbonSection label={label}>
			<Tooltip
				content={t(
					"ribbonBar.advancedTooltip",
					"Applies to the Edit, Time and Preview ribbons.",
				)}
			>
				{/* The wrapper takes the tooltip's data-state, which would otherwise
				    replace the switch's own "checked"/"unchecked" state. */}
				<span style={{ display: "inline-flex" }}>
					<Switch
						checked={showAdvanced}
						onCheckedChange={setShowAdvanced}
						aria-label={label}
					/>
				</span>
			</Tooltip>
		</RibbonSection>
	);
};
