import {
	Checkbox,
	SegmentedControl,
	Switch,
	TextField,
} from "@radix-ui/themes";
import { useAtom, type WritableAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { OptionPicker, type PickerOption } from "$/components/OptionPicker";
import {
	type BackgroundSyncMode,
	backgroundSyncModeAtom,
} from "../states/background-sync";
import {
	PreviewModeType,
	previewModeTypeAtom,
	spicyBackgroundModeAtom,
} from "../states/preview";
import {
	syncCommitOffsetAtom,
	syncLevelModeAtom,
	syncTimeOffsetAtom,
} from "../states/sync";

// atomWithStorage setters also accept RESET/updater values; the controls only
// need the common boolean setter contract.
export function SettingToggle({
	setting,
	compact = false,
	id,
}: {
	setting: WritableAtom<boolean, [boolean], unknown>;
	compact?: boolean;
	id?: string;
}) {
	const [checked, setChecked] = useAtom(setting);
	const onCheckedChange = (value: boolean | "indeterminate") =>
		setChecked(value === true);
	return compact ? (
		<Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
	) : (
		<Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
	);
}

export function parseSyncOffset(value: string): number {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function SyncOffsetControl({
	commit = false,
	compact = false,
}: {
	commit?: boolean;
	compact?: boolean;
}) {
	const [value, setValue] = useAtom(
		commit ? syncCommitOffsetAtom : syncTimeOffsetAtom,
	);
	return (
		<TextField.Root
			type="number"
			step={1}
			size={compact ? "1" : "2"}
			style={compact ? { width: "8em" } : undefined}
			value={value}
			onChange={(event) => setValue(parseSyncOffset(event.target.value))}
		/>
	);
}

export function SyncLevelControl() {
	const [value, setValue] = useAtom(syncLevelModeAtom);
	const { t } = useTranslation();
	return (
		<SegmentedControl.Root
			value={value}
			onValueChange={(next) => {
				if (next === "word" || next === "line") setValue(next);
			}}
			size="1"
		>
			<SegmentedControl.Item value="word">
				{t("ribbonBar.syncMode.syncLevelWord", "Word")}
			</SegmentedControl.Item>
			<SegmentedControl.Item value="line">
				{t("ribbonBar.syncMode.syncLevelLine", "Line")}
			</SegmentedControl.Item>
		</SegmentedControl.Root>
	);
}

export function BackgroundSyncControl() {
	const [value, setValue] = useAtom(backgroundSyncModeAtom);
	const { t } = useTranslation();
	const options: readonly PickerOption<BackgroundSyncMode>[] = [
		{
			value: "inline",
			label: t("ribbonBar.syncMode.bgSyncInline", "Inline"),
			description: t(
				"ribbonBar.syncMode.bgSyncInlineDesc",
				"Sync each background line right after its main line.",
			),
		},
		{
			value: "separate",
			label: t("ribbonBar.syncMode.bgSyncSeparate", "Separate pass"),
			description: t(
				"ribbonBar.syncMode.bgSyncSeparateDesc",
				"G and H stay on main lines. Click a background line to sync the background lines on their own.",
			),
		},
		{
			value: "skip",
			label: t("ribbonBar.syncMode.bgSyncSkip", "Skip"),
			description: t(
				"ribbonBar.syncMode.bgSyncSkipDesc",
				"Leave background lines out of keyboard syncing.",
			),
		},
	];
	return (
		<OptionPicker
			value={value}
			options={options}
			onValueChange={setValue}
			label={t("ribbonBar.syncMode.bgLyricSync", "Background lines")}
		/>
	);
}

export function PreviewModeControl() {
	const [value, setValue] = useAtom(previewModeTypeAtom);
	const { t } = useTranslation();
	return (
		<SegmentedControl.Root
			value={value}
			onValueChange={(next) => {
				if (Object.values(PreviewModeType).some((mode) => mode === next))
					setValue(next as PreviewModeType);
			}}
		>
			<SegmentedControl.Item value={PreviewModeType.Standard}>
				{t("ribbonBar.previewMode.standard", "Standard")}
			</SegmentedControl.Item>
			<SegmentedControl.Item value={PreviewModeType.Toxi}>
				Toxi
			</SegmentedControl.Item>
			<SegmentedControl.Item value={PreviewModeType.Spicy}>
				Spicy
			</SegmentedControl.Item>
			<SegmentedControl.Item value={PreviewModeType.Timing}>
				{t("ribbonBar.previewMode.timing", "Timing")}
			</SegmentedControl.Item>
		</SegmentedControl.Root>
	);
}

export function SpicyBackgroundControl() {
	const [value, setValue] = useAtom(spicyBackgroundModeAtom);
	const { t } = useTranslation();
	return (
		<SegmentedControl.Root
			value={value}
			onValueChange={(next) => {
				if (next === "animated" || next === "color" || next === "static")
					setValue(next);
			}}
			size="1"
		>
			<SegmentedControl.Item value="animated">
				{t("ribbonBar.previewMode.backgroundAnimated", "Animated")}
			</SegmentedControl.Item>
			<SegmentedControl.Item value="color">
				{t("ribbonBar.previewMode.backgroundColor", "Color")}
			</SegmentedControl.Item>
			<SegmentedControl.Item value="static">
				{t("ribbonBar.previewMode.backgroundStatic", "Static")}
			</SegmentedControl.Item>
		</SegmentedControl.Root>
	);
}
