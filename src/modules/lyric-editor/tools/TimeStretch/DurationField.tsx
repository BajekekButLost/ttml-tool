import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatDurationInput, parseDurationInput } from "../time-stretch";

type DurationFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onUseCurrent: () => void;
	currentSongAvailable: boolean;
	error?: string;
	secondaryAction?: ReactNode;
	footer?: ReactNode;
};

export const DurationField = ({
	label,
	value,
	onChange,
	onUseCurrent,
	currentSongAvailable,
	error,
	secondaryAction,
	footer,
}: DurationFieldProps) => {
	const { t } = useTranslation();
	const parsedDuration = parseDurationInput(value);
	return (
		<Flex direction="column" gap="3" style={{ minWidth: 0 }}>
			<Text size="3" weight="bold" align="center">
				{label}
			</Text>
			<TextField.Root
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onBlur={() =>
					parsedDuration !== null &&
					onChange(formatDurationInput(parsedDuration))
				}
				placeholder={t(
					"timeStretchDialog.durationPlaceholder",
					"MM:SS.mmm or seconds",
				)}
				style={{ width: "100%" }}
			/>
			{secondaryAction ? (
				<Flex gap="2" style={{ width: "100%" }}>
					<Button
						variant="soft"
						disabled={!currentSongAvailable}
						onClick={onUseCurrent}
						style={{ flex: 1 }}
					>
						{t("timeStretchDialog.useCurrentSong", "Use current song")}
					</Button>
					{secondaryAction}
				</Flex>
			) : (
				<Button
					variant="soft"
					disabled={!currentSongAvailable}
					onClick={onUseCurrent}
					style={{ width: "100%" }}
				>
					{t("timeStretchDialog.useCurrentSong", "Use current song")}
				</Button>
			)}
			{error && (
				<Text size="1" color="red">
					{error}
				</Text>
			)}
			{footer}
		</Flex>
	);
};
