import { TextField } from "@radix-ui/themes";
import classNames from "classnames";
import type { ComponentPropsWithoutRef } from "react";
import styles from "../components/index.module.css";

export const AutoSizeTextField = ({
	value,
	className,
	style,
	placeholder,
	inputRef,
	...rest
}: ComponentPropsWithoutRef<typeof TextField.Root> & {
	inputRef?: React.Ref<HTMLInputElement>;
}) => {
	const valueString =
		value === undefined || value === null ? "" : String(value);
	const mirrorText =
		valueString.length > 0
			? valueString
			: typeof placeholder === "string" && placeholder.length > 0
				? placeholder
				: "    ";
	return (
		<span className={classNames(styles.autoSizeInput, className)} style={style}>
			<span className={styles.autoSizeInputText}>{mirrorText}</span>
			<TextField.Root
				className={styles.autoSizeInputField}
				value={value}
				placeholder={placeholder}
				ref={inputRef}
				{...rest}
				data-empty={valueString.length === 0 ? "" : undefined}
			/>
		</span>
	);
};
