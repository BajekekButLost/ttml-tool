import { Add20Regular, TranslateRegular } from "@fluentui/react-icons";
import { IconButton } from "@radix-ui/themes";
import classNames from "classnames";
import type { Atom } from "jotai";
import type { LyricWord } from "$/types/ttml.ts";
import styles from "../components/index.module.css";
import { AutoSizeTextField } from "./RubyEditor/AutoSizeTextField";
import { RubyWarningDialog } from "./RubyEditor/RubyWarningDialog";
import { useRubyEditor } from "./RubyEditor/use-ruby-editor";

export { AutoSizeTextField } from "./RubyEditor/AutoSizeTextField";

export const RubyEditor = ({
	wordAtom,
	forceShow,
	showIcon,
	className,
}: {
	wordAtom: Atom<LyricWord>;
	forceShow?: boolean;
	showIcon?: boolean;
	className?: string;
}) => {
	const {
		word,
		rubyWords,
		inputRefs,
		warningOpen,
		setWarningOpen,
		addRubyWord,
		updateRubyWord,
		removeRubyWord,
		mergeRubyWithPrevious,
		applyRubyToAllSameWords,
	} = useRubyEditor(wordAtom);

	if (!forceShow && rubyWords.length === 0) return null;

	return (
		<>
			<RubyWarningDialog
				warningOpen={warningOpen}
				setWarningOpen={setWarningOpen}
			/>
			<span className={classNames(styles.rubyEditor, className)}>
				{showIcon && (
					<IconButton size="1" variant="soft" onClick={applyRubyToAllSameWords}>
						<TranslateRegular />
					</IconButton>
				)}
				{rubyWords.map((rubyWord, index) => (
					<AutoSizeTextField
						key={`${word.id}-ruby-${index}`}
						size="1"
						inputRef={(el) => {
							inputRefs.current[index] = el;
						}}
						value={rubyWord.word}
						onChange={(evt) => updateRubyWord(index, evt.currentTarget.value)}
						onKeyDown={(evt) => {
							if (evt.key !== "Backspace") return;
							const selectionStart = evt.currentTarget.selectionStart ?? 0;
							const selectionEnd = evt.currentTarget.selectionEnd ?? 0;
							const isAtStart = selectionStart === 0 && selectionEnd === 0;
							if (isAtStart && index > 0) {
								evt.preventDefault();
								mergeRubyWithPrevious(index);
								return;
							}
							if (evt.currentTarget.value !== "") return;
							evt.preventDefault();
							removeRubyWord(index);
							if (index > 0) {
								requestAnimationFrame(() => {
									inputRefs.current[index - 1]?.focus();
								});
							}
						}}
					/>
				))}
				<IconButton size="1" variant="soft" onClick={addRubyWord}>
					<Add20Regular />
				</IconButton>
			</span>
		</>
	);
};
