import { useEffect, useState } from "react";

const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// Drop an image named after the room (e.g. roomImages/NEJ1.jpg) to give that
// room a custom background. Falls back to the default .nice-backgound image
// (set in index.css) when no matching file exists.
export function useRoomImage(roomName: string): string | null {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setUrl(null);

		async function findImage() {
			for (const ext of EXTENSIONS) {
				const candidate = `/roomImages/${encodeURIComponent(roomName)}.${ext}`;
				const found = await new Promise<boolean>((resolve) => {
					const img = new Image();
					img.onload = () => resolve(true);
					img.onerror = () => resolve(false);
					img.src = candidate;
				});
				if (cancelled) return;
				if (found) {
					setUrl(candidate);
					return;
				}
			}
		}

		findImage();
		return () => {
			cancelled = true;
		};
	}, [roomName]);

	return url;
}
