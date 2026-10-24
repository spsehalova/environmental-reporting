interface IconProps {
	src: string;
	className?: string;
}

/**
 * Icons in src/icons are imported as raw file URLs (see bun-env.d.ts), so
 * their `stroke/fill="currentColor"` never resolves. Masking the shape with
 * a `background-color: currentColor` div recolors them via normal Tailwind
 * text-color classes instead.
 */
export function Icon({ src, className }: IconProps) {
	return (
		<span
			className={className}
			style={{
				display: "inline-block",
				backgroundColor: "currentColor",
				WebkitMaskImage: `url(${src})`,
				maskImage: `url(${src})`,
				WebkitMaskSize: "contain",
				maskSize: "contain",
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskPosition: "center",
				maskPosition: "center",
			}}
		/>
	);
}
