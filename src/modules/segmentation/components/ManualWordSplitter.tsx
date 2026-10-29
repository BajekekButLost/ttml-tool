/**
 * @description 手动分词组件
 */

import { Flex } from "@radix-ui/themes";
import { Fragment, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { graphemes } from "$/utils/graphemes";
import styles from "./ManualWordSplitter.module.css";

interface ManualWordSplitterProps {
	word: string;
	splitIndices: Set<number>;
	onSplitIndexToggle: (index: number) => void;
}

export const ManualWordSplitter = memo(
	({ word, splitIndices, onSplitIndexToggle }: ManualWordSplitterProps) => {
		const manualGraphemes = useMemo(() => graphemes(word), [word]);
		const { t } = useTranslation();
		const label = (index: number) =>
			t("syllableSplitting.boundary", {
				left: manualGraphemes[index - 1],
				right: manualGraphemes[index],
			});

		return (
			<Flex
				align="center"
				justify="start"
				style={{
					backgroundColor: "var(--gray-4)",
					borderRadius: "var(--radius-2)",
					padding: "var(--space-4)",
					minHeight: "4em",
					userSelect: "none",
					overflowX: "auto",
					whiteSpace: "nowrap",
					justifyContent: "safe center",
				}}
			>
				{manualGraphemes.map((grapheme, index) => (
					<Fragment
						key={`${grapheme}-${
							// biome-ignore lint/suspicious/noArrayIndexKey: 这个列表顺序不会在交互时发生变化
							index
						}`}
					>
						{index > 0 && (
							<button
								type="button"
								className={styles.manualSplitter}
								data-split={splitIndices.has(index)}
								aria-label={label(index)}
								aria-pressed={splitIndices.has(index)}
								onClick={() => onSplitIndexToggle(index)}
							/>
						)}
						<span className={styles.grapheme}>{grapheme}</span>
					</Fragment>
				))}
			</Flex>
		);
	},
);
