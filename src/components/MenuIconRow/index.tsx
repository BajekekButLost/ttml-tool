import { ContextMenu } from "@radix-ui/themes";
import type { CSSProperties, ReactNode } from "react";
import styles from "./index.module.css";

/**
 * A row of icon buttons inside a context menu, for a few related actions
 * that would otherwise take a line each. They stay real menu items, so the
 * arrow keys and Enter reach them like any other.
 */
export function MenuIconRow({
	label,
	children,
}: {
	/** Names the group for assistive tech. */
	label: string;
	children: ReactNode;
}) {
	return (
		<div role="group" aria-label={label} className={styles.row}>
			{children}
		</div>
	);
}

/** An on/off icon button. Its label shows on hover and is read out. */
function Toggle({
	icon,
	label,
	checked,
	onCheckedChange,
	color,
	disabled,
}: {
	icon: ReactNode;
	label: string;
	checked: boolean | "indeterminate";
	onCheckedChange: (checked: boolean) => void;
	/** The colour of the icon when on, for colour-coded roles. */
	color?: string;
	disabled?: boolean;
}) {
	return (
		<ContextMenu.CheckboxItem
			className={styles.button}
			checked={checked}
			onCheckedChange={onCheckedChange}
			disabled={disabled}
			aria-label={label}
			title={label}
			style={
				color ? ({ "--menu-icon-color": color } as CSSProperties) : undefined
			}
		>
			{icon}
		</ContextMenu.CheckboxItem>
	);
}

/** A one-off action as an icon button. */
function Action({
	icon,
	label,
	onSelect,
	disabled,
}: {
	icon: ReactNode;
	label: string;
	onSelect: () => void;
	disabled?: boolean;
}) {
	return (
		<ContextMenu.Item
			className={styles.button}
			onSelect={onSelect}
			disabled={disabled}
			aria-label={label}
			title={label}
		>
			{icon}
		</ContextMenu.Item>
	);
}

MenuIconRow.Toggle = Toggle;
MenuIconRow.Action = Action;
