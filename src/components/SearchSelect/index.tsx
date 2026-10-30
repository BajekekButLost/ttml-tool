import {
	Checkmark16Regular,
	ChevronDown16Regular,
	Search16Regular,
} from "@fluentui/react-icons";
import { Button, Popover, Text, TextField } from "@radix-ui/themes";
import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
import styles from "./index.module.css";

export interface SearchSelectOption {
	value: string;
	label: string;
	/** Heading the option is listed under. Groups keep the order they first appear in. */
	group?: string;
	/** Short text on the right, like the action's current shortcut. */
	hint?: ReactNode;
}

/** Lowercase without accents, so "edicion" finds "Edición". */
function fold(text: string): string {
	return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}

/** Options whose label or group contains every word of the query. */
export function filterSearchOptions<T extends SearchSelectOption>(
	options: readonly T[],
	query: string,
): T[] {
	const words = fold(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return [...options];
	return options.filter((option) => {
		const text = fold(`${option.label} ${option.group ?? ""}`);
		return words.every((word) => text.includes(word));
	});
}

const PAGE = 8;

/**
 * A select with a search field, for lists too long to scroll through: type
 * to filter, arrow keys to move, Enter to pick, Esc to close.
 */
export function SearchSelect({
	value,
	options,
	onValueChange,
	placeholder,
	searchPlaceholder,
	emptyText,
	label,
}: {
	value: string | undefined;
	options: readonly SearchSelectOption[];
	onValueChange: (value: string) => void;
	/** Trigger text while nothing is picked. */
	placeholder: string;
	searchPlaceholder: string;
	emptyText: string;
	/** Accessible name for the trigger and the list. */
	label: string;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const listId = useId();
	const optionId = (index: number) => `${listId}-${index}`;

	const results = useMemo(
		() => filterSearchOptions(options, query),
		[options, query],
	);
	const active = Math.min(activeIndex, Math.max(results.length - 1, 0));
	const selected = options.find((option) => option.value === value);

	useEffect(() => {
		if (!open || results.length === 0) return;
		document
			.getElementById(optionId(active))
			?.scrollIntoView({ block: "nearest" });
	});

	const openChange = (next: boolean) => {
		setOpen(next);
		if (next) {
			setQuery("");
			const current = options.findIndex((option) => option.value === value);
			setActiveIndex(Math.max(current, 0));
		}
	};

	const pick = (option: SearchSelectOption | undefined) => {
		if (!option) return;
		onValueChange(option.value);
		setOpen(false);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.nativeEvent.isComposing) return;
		const last = results.length - 1;
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				setActiveIndex(active >= last ? 0 : active + 1);
				break;
			case "ArrowUp":
				event.preventDefault();
				setActiveIndex(active <= 0 ? last : active - 1);
				break;
			case "PageDown":
				event.preventDefault();
				setActiveIndex(Math.min(active + PAGE, last));
				break;
			case "PageUp":
				event.preventDefault();
				setActiveIndex(Math.max(active - PAGE, 0));
				break;
			case "Enter":
				event.preventDefault();
				pick(results[active]);
				break;
		}
	};

	return (
		<Popover.Root open={open} onOpenChange={openChange}>
			<Popover.Trigger>
				<Button
					variant="surface"
					color="gray"
					className={styles.trigger}
					aria-label={label}
					aria-haspopup="listbox"
				>
					<span
						className={styles.triggerText}
						data-placeholder={selected ? undefined : ""}
					>
						{selected?.label ?? placeholder}
						{/* Same-named options, like three Auto-scrolls, differ by group. */}
						{selected?.group && (
							<span className={styles.triggerGroup}>{selected.group}</span>
						)}
					</span>
					<ChevronDown16Regular aria-hidden />
				</Button>
			</Popover.Trigger>
			<Popover.Content
				className={styles.content}
				align="start"
				sideOffset={4}
				aria-label={label}
			>
				<TextField.Root
					size="2"
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setActiveIndex(0);
					}}
					onKeyDown={onKeyDown}
					placeholder={searchPlaceholder}
					role="combobox"
					aria-label={searchPlaceholder}
					aria-expanded
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={
						results.length > 0 ? optionId(active) : undefined
					}
					autoComplete="off"
					spellCheck={false}
				>
					<TextField.Slot>
						<Search16Regular aria-hidden />
					</TextField.Slot>
				</TextField.Root>
				<div
					id={listId}
					role="listbox"
					aria-label={label}
					className={styles.list}
				>
					{/* Keyboard is handled on the search field (aria-activedescendant). */}
					{results.map((option, index) => {
						const heading =
							option.group !== undefined &&
							option.group !== results[index - 1]?.group;
						return (
							<div key={option.value} className={styles.row}>
								{heading && (
									<Text
										as="div"
										size="1"
										color="gray"
										className={styles.group}
										aria-hidden
									>
										{option.group}
									</Text>
								)}
								<div
									id={optionId(index)}
									role="option"
									tabIndex={-1}
									aria-selected={index === active}
									aria-checked={option.value === value}
									className={styles.option}
									onPointerMove={() => {
										if (index !== active) setActiveIndex(index);
									}}
									onClick={() => pick(option)}
								>
									<span className={styles.check} aria-hidden>
										{option.value === value && <Checkmark16Regular />}
									</span>
									<Text size="2" className={styles.label}>
										{option.label}
									</Text>
									{option.hint && (
										<Text size="1" color="gray" className={styles.hint}>
											{option.hint}
										</Text>
									)}
								</div>
							</div>
						);
					})}
				</div>
				{results.length === 0 && (
					<Text
						as="div"
						size="2"
						color="gray"
						role="status"
						className={styles.empty}
					>
						{emptyText}
					</Text>
				)}
			</Popover.Content>
		</Popover.Root>
	);
}
