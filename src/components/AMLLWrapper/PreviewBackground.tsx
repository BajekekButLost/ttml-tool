import {
	BackgroundRender,
	MeshGradientRenderer,
} from "@applemusic-like-lyrics/core";
import { useEffect, useRef, useState } from "react";

export function PreviewBackground({
	album,
	playing,
}: {
	album?: string;
	playing: boolean;
}) {
	const container = useRef<HTMLDivElement>(null);
	const [renderer, setRenderer] = useState<BackgroundRender | null>(null);

	useEffect(() => {
		const background = BackgroundRender.new(MeshGradientRenderer);
		setRenderer(background);
		background.setRenderScale(0.5);
		const canvas = background.getElement();
		Object.assign(canvas.style, {
			width: "100%",
			height: "100%",
			minHeight: "0",
			minWidth: "0",
			overflow: "hidden",
		});
		container.current?.appendChild(canvas);
		let loading = Boolean(album);
		let disposed = false;
		if (album) {
			void background
				.setAlbum(album)
				.catch(console.error)
				.finally(() => {
					loading = false;
					if (disposed) background.dispose();
				});
		}
		return () => {
			disposed = true;
			background.pause();
			canvas.remove();
			if (!loading) background.dispose();
		};
	}, [album]);

	useEffect(() => {
		if (playing) renderer?.resume();
		else renderer?.pause();
	}, [renderer, playing]);

	return <div ref={container} style={{ display: "contents" }} />;
}
