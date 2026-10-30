import { Text } from "@radix-ui/themes";
import type { Atom, WritableAtom } from "jotai";
import { type FC, type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { ActionTooltip } from "$/components/ActionTooltip";
import type { ToggleAction } from "$/modules/menu-actions/ribbon-actions";
import { SettingToggle } from "$/modules/settings/components/WorkflowControls";
import type { KeyBindingsConfig } from "$/utils/keybindings";

/** A ribbon label that shows the control's tooltip. */
export const RibbonLabel: FC<{
	label: string;
	description?: ReactNode;
	shortcut?: Atom<KeyBindingsConfig>;
	htmlFor?: string;
}> = ({ label, description, shortcut, htmlFor }) => (
	<ActionTooltip label={label} description={description} shortcut={shortcut}>
		<Text
			wrap="nowrap"
			size="1"
			asChild
			style={{ color: "var(--ribbon-label-color)" }}
		>
			<label htmlFor={htmlFor}>{label}</label>
		</Text>
	</ActionTooltip>
);

/** A ribbon toggle drawn from its shared definition, so its label and shortcut match the command's. */
export const RibbonActionToggle: FC<{
	action: ToggleAction;
	description?: ReactNode;
}> = ({ action, description }) => {
	const { t } = useTranslation();
	return (
		<RibbonToggle
			label={action.label((key, fallback) => t(key, fallback))}
			description={description}
			shortcut={action.command.atom}
			setting={action.setting}
		/>
	);
};

/** A label and checkbox pair for a two-column ribbon grid, both with the tooltip. */
export const RibbonToggle: FC<{
	label: string;
	description?: ReactNode;
	shortcut?: Atom<KeyBindingsConfig>;
	setting: WritableAtom<boolean, [boolean], unknown>;
}> = ({ label, description, shortcut, setting }) => {
	const id = useId();
	return (
		<>
			<RibbonLabel
				label={label}
				description={description}
				shortcut={shortcut}
				htmlFor={id}
			/>
			<ActionTooltip
				label={label}
				description={description}
				shortcut={shortcut}
			>
				<SettingToggle setting={setting} compact id={id} />
			</ActionTooltip>
		</>
	);
};
