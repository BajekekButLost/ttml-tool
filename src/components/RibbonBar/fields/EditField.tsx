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

import { Button, Text, TextField } from "@radix-ui/themes";
import type React from "react";
import type { LyricLine, LyricWord } from "$/types/ttml";

import { useEditField } from "./useEditField";
export function EditField<
	L extends Word extends true ? LyricWord : LyricLine,
	F extends keyof L,
	Word extends boolean | undefined = undefined,
>(props: {
	label: string;
	isWordField?: Word;
	fieldName: F;
	formatter: (v: L[F]) => string;
	parser: (v: string) => L[F];
	textFieldStyle?: React.CSSProperties;
}) {
	const {
		t,
		fieldName,
		label,
		showDurationInput,
		setShowDurationInput,
		inputRef,
		hasError,
		textFieldStyle,
		fieldInput,
		fieldPlaceholder,
		setFieldInput,
		onInputFinished,
		isWordField,
		setEditingTimeField,
		compareValue,
	} = useEditField<L, F, Word>(props);

	return (
		<>
			{fieldName === "endTime" ? (
				<Button
					size="1"
					variant="ghost"
					style={{
						justifyContent: "flex-start",
						paddingLeft: "0px",
						marginLeft: 0,
					}}
					onClick={() => setShowDurationInput((v) => !v)}
				>
					{showDurationInput
						? t("ribbonBar.editMode.duration", "持续时间")
						: label}
				</Button>
			) : (
				<Text
					wrap="nowrap"
					size="1"
					style={{ color: "var(--ribbon-label-color)" }}
				>
					{label}
				</Text>
			)}
			<TextField.Root
				ref={inputRef}
				size="1"
				color={hasError ? "red" : undefined}
				variant={hasError ? "soft" : undefined}
				style={{ width: "8em", ...textFieldStyle }}
				value={fieldInput ?? ""}
				placeholder={fieldPlaceholder}
				disabled={fieldInput === undefined}
				onChange={(evt) => setFieldInput(evt.currentTarget.value)}
				onKeyDown={(evt) => {
					if (evt.key !== "Enter") return;
					onInputFinished(evt.currentTarget.value);
				}}
				onFocus={() => {
					if (
						!isWordField &&
						(fieldName === "startTime" || fieldName === "endTime")
					) {
						setEditingTimeField({
							isWord: false,
							field: fieldName as "startTime" | "endTime",
						});
					}
				}}
				onBlur={(evt) => {
					setEditingTimeField(null);

					if (evt.currentTarget.value === compareValue) return;
					onInputFinished(evt.currentTarget.value);
				}}
			/>
		</>
	);
}
