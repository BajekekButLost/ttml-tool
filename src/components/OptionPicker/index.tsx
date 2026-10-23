import { ChevronDownRegular } from "@fluentui/react-icons";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import styles from "./index.module.css";

export interface PickerOption<T extends string> {
	value: T;
	label: string;
	/** One line under the label in the menu; the trigger only shows the label. */
	description?: string;
}

/**
 * A compact choice between a few named modes: the trigger shows only the current
 * label, and the menu explains each option. Use it instead of a segmented control
 * where width is tight or the options need explaining.
 */
export function OptionPicker<T extends string>({
	value,
	options,
	onValueChange,
	label,
	size = "1",
}: {
	value: T;
	options: readonly PickerOption<T>[];
	onValueChange: (value: T) => void;
	/** Accessible name for the trigger, usually the setting's title. */
	label: string;
	size?: "1" | "2";
}) {
	const current = options.find((option) => option.value === value);
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button
					variant="soft"
					color="gray"
					size={size}
					aria-label={`${label}: ${current?.label ?? value}`}
					className={styles.trigger}
				>
					{current?.label ?? value}
					<ChevronDownRegular className={styles.chevron} />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content size={size} className={styles.content}>
				<DropdownMenu.RadioGroup
					value={value}
					onValueChange={(next) => {
						const option = options.find((item) => item.value === next);
						if (option) onValueChange(option.value);
					}}
				>
					{options.map((option) => (
						<DropdownMenu.RadioItem
							key={option.value}
							value={option.value}
							className={styles.item}
						>
							<Flex direction="column" gap="0" py="1">
								<Text size={size} weight="medium">
									{option.label}
								</Text>
								{option.description && (
									<Text size="1" className={styles.description}>
										{option.description}
									</Text>
								)}
							</Flex>
						</DropdownMenu.RadioItem>
					))}
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
