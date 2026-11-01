import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
	onClose: () => void;
	children: ReactNode;
}

/**
 * Renders via a portal into #app-root (see App.tsx) rather than in place,
 * since a `position: fixed` modal nested under any ancestor with a
 * transform/filter/backdrop-filter (e.g. a card's backdrop-blur) gets its
 * containing block hijacked by that ancestor and clips to its tiny box
 * instead of the screen. #app-root is the top-level scaled wrapper, so the
 * modal still scales correctly with the app's ?zoom= factor.
 */
export function Modal({ onClose, children }: ModalProps) {
	const portalTarget = document.getElementById("app-root") ?? document.body;

	return createPortal(
		<div
			className="fixed inset-0 z-200 flex items-stretch sm:items-center justify-center bg-black/60 sm:p-4 animate-[modal-overlay-in_0.2s_ease-out]"
			onClick={(e) => {
				e.stopPropagation();
				onClose();
			}}
		>
			<div
				className="relative w-full h-full sm:h-auto sm:max-w-xl animate-[modal-panel-in_0.25s_cubic-bezier(0.16,1,0.3,1)]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="h-full sm:h-auto sm:max-h-[85vh] overflow-y-auto rounded-none sm:rounded-3xl bg-[#1c1c1e] sm:bg-[#1c1c1e]/95 p-5 pt-16 sm:p-6 text-white shadow-2xl sm:backdrop-blur-xl">
					{children}
				</div>

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur"
				>
					<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
						<path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
					</svg>
				</button>
			</div>
		</div>,
		portalTarget,
	);
}
