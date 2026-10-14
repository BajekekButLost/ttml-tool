/**
 * Reference from: https://www.figma.com/community/file/1251588934545918753
 */

import { useTranslation } from "react-i18next";
import type { SystemControlProps } from "./index.tsx";
import styles from "./macos.module.css";

export function MacOSSystemsControls(props: SystemControlProps) {
	const { t } = useTranslation();
	return (
		<div className={styles.controls}>
			<div>
				<button
					type="button"
					className={styles.close}
					aria-label={t("app.window.close", "Close window")}
					onClick={props.onClosed}
				/>
				<button
					type="button"
					className={styles.minimize}
					aria-label={t("app.window.minimize", "Minimize window")}
					onClick={props.onMinimized}
				/>
				<button
					type="button"
					className={styles.zoom}
					aria-label={t("app.window.maximize", "Maximize window")}
					onClick={props.onMaximized}
				/>
			</div>
		</div>
	);
}
