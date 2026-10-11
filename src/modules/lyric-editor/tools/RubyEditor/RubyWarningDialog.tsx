import { Warning48Color } from "@fluentui/react-icons";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";

export const RubyWarningDialog = ({
	warningOpen,
	setWarningOpen,
}: {
	warningOpen: boolean;
	setWarningOpen: (open: boolean) => void;
}) => (
	<Dialog.Root open={warningOpen} onOpenChange={setWarningOpen}>
		<Dialog.Content
			style={{
				position: "fixed",
				inset: 0,
				width: "100vw",
				height: "100vh",
				maxWidth: "100vw",
				maxHeight: "100vh",
				borderRadius: 0,
				padding: 0,
				background: "transparent",
			}}
		>
			<Flex
				direction="column"
				align="center"
				justify="center"
				height="100%"
				style={{
					backdropFilter: "blur(10px)",
					background: "rgba(0, 0, 0, 0.35)",
					padding: "var(--space-6)",
				}}
			>
				<Flex
					direction="column"
					align="center"
					justify="center"
					gap="4"
					style={{
						background: "var(--color-panel)",
						borderRadius: "var(--radius-4)",
						padding: "var(--space-6)",
						maxWidth: "720px",
						width: "min(90vw, 720px)",
						boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
					}}
				>
					<Warning48Color />
					<Text size="5">
						你正在使用测试中的
						<Text as="span" weight="bold">
							{" "}
							注音{" "}
						</Text>
						功能
					</Text>
					<Text size="4" align="center">
						一旦你添加了注音内容，保存的文件将无法被不支持该结构的解析器使用
					</Text>
					<Text size="4" align="center">
						如果仍要在不支持的解析器中使用，可能会出现缺少文字等现象
					</Text>
					<Dialog.Close>
						<Button>我已了解</Button>
					</Dialog.Close>
				</Flex>
			</Flex>
		</Dialog.Content>
	</Dialog.Root>
);
