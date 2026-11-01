import { useEffect, useState, type ReactNode } from "react";
import { Chart } from "react-charts";
import { fetchDayData, fetchDayFlags, type DayDataPoint, type DayFlag } from "../lib/dayData";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

export interface GraphSeriesConfig {
	key: string;
	label: string;
	color: string;
	defaultActive?: boolean;
}

export interface GradientStop {
	offset: number;
	color: string;
}

export interface DetailRow {
	abbr: string;
	label: string;
	value: number | null;
	unit?: string;
}

interface GraphModalProps {
	icon: string;
	title: string;
	roomName: string;
	series: GraphSeriesConfig[];
	value: string;
	unit?: string;
	/** Secondary line under the value, e.g. a category name like "Dobré" (distinct from `unit`, which renders inline next to the number). */
	subLabel?: string;
	summary?: string;
	onClose: () => void;
	/** Forces the value axis range instead of auto-scaling to the day's data (e.g. humidity is always 0-100%). */
	yDomain?: { min?: number; max?: number };
	/**
	 * Vertical gradient (offset 0% = axis max, 100% = axis min) applied to the
	 * single active series' line/area instead of its flat color. Only used
	 * when exactly one series is active, since overlaying gradients on
	 * multiple lines reads as noise.
	 */
	gradientStops?: GradientStop[];
	/** Backend day-variable name for a boolean flag (e.g. "warmingUp"). When set and exactly one series is active, that series gets split into dashed/faded segments wherever the flag is true. */
	warmupVariable?: string;
	/** "Hlavný faktor"-style freeform text block rendered below the scale bar. */
	mainFactor?: { subtitle?: string; text: string };
	/** "Detaily" key/value list rendered at the bottom. */
	details?: DetailRow[];
	/** Escape hatch for anything else a specific card wants to show. */
	children?: ReactNode;
}

const HOUR_FORMATTER = new Intl.DateTimeFormat("sk-SK", { hour: "2-digit", minute: "2-digit", hour12: false });
const GRADIENT_ID = "graph-modal-gradient";

function todayBounds(): [Date, Date] {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + 1);
	return [start, end];
}

function hexToRgb(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixColors(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
	return `#${hex(r1 + (r2 - r1) * t)}${hex(g1 + (g2 - g1) * t)}${hex(b1 + (b2 - b1) * t)}`;
}

/**
 * `gradientStops` are authored against the full fixed axis domain (offset 0%
 * = domainMax, 100% = domainMin). SVG's objectBoundingBox gradient geometry
 * only spans the rendered path's own bounding box though, which follows the
 * day's actual peak value rather than the axis max — so on a quiet/low day
 * the "severe" stop would land at the wrong apparent position. Resample the
 * conceptual gradient down to the data's real range before handing it to SVG.
 */
export function resampleGradientStops(stops: GradientStop[], domainMax: number, dataMax: number): GradientStop[] {
	if (dataMax >= domainMax || dataMax <= 0) return stops;
	const sorted = [...stops].sort((a, b) => a.offset - b.offset);
	const dataMaxOffset = (1 - dataMax / domainMax) * 100;

	function colorAtOffset(target: number): string {
		for (let i = 0; i < sorted.length - 1; i++) {
			const a = sorted[i]!;
			const b = sorted[i + 1]!;
			if (target >= a.offset && target <= b.offset) {
				return mixColors(a.color, b.color, (target - a.offset) / (b.offset - a.offset || 1));
			}
		}
		return sorted[sorted.length - 1]!.color;
	}

	const span = 100 - dataMaxOffset || 1;
	return [
		{ offset: 0, color: colorAtOffset(dataMaxOffset) },
		...sorted
			.filter((s) => s.offset > dataMaxOffset)
			.map((s) => ({ offset: ((s.offset - dataMaxOffset) / span) * 100, color: s.color })),
	];
}

interface WarmupSegment {
	label: string;
	data: DayDataPoint[];
	color: string;
	dashed: boolean;
}

/**
 * Splits a series into contiguous runs of "warming up" vs "normal", each
 * rendered as its own chart series so they can get different line styles.
 * Each new segment repeats the previous segment's last point so the line
 * stays visually continuous instead of showing a gap at the boundary.
 */
function segmentByWarmup(data: DayDataPoint[], warmFlags: DayFlag[], color: string): WarmupSegment[] {
	if (data.length === 0) return [];
	const sortedFlags = [...warmFlags].sort((a, b) => a.time.getTime() - b.time.getTime());

	function warmingAt(t: Date): boolean {
		let result = false;
		for (const flag of sortedFlags) {
			if (flag.time.getTime() > t.getTime()) break;
			result = flag.value;
		}
		return result;
	}

	const segments: WarmupSegment[] = [];
	let current: DayDataPoint[] = [data[0]!];
	let currentWarming = warmingAt(data[0]!.time);

	for (let i = 1; i < data.length; i++) {
		const point = data[i]!;
		const warming = warmingAt(point.time);
		if (warming === currentWarming) {
			current.push(point);
			continue;
		}
		segments.push({ label: `seg-${segments.length}`, data: current, color, dashed: currentWarming });
		current = [{ ...current[current.length - 1]! }, point];
		currentWarming = warming;
	}
	segments.push({ label: `seg-${segments.length}`, data: current, color, dashed: currentWarming });
	return segments;
}

export function GraphModal({
	icon,
	title,
	roomName,
	series,
	value,
	unit,
	subLabel,
	summary,
	onClose,
	yDomain,
	gradientStops,
	warmupVariable,
	mainFactor,
	details,
	children,
}: GraphModalProps) {
	const [dataByKey, setDataByKey] = useState<Record<string, DayDataPoint[]>>({});
	const [warmFlags, setWarmFlags] = useState<DayFlag[] | null>(null);
	const [activeKeys, setActiveKeys] = useState<Set<string>>(
		() => new Set(series.filter((s) => s.defaultActive !== false).map((s) => s.key)),
	);
	const seriesKeys = series.map((s) => s.key).join(",");

	useEffect(() => {
		let cancelled = false;
		setDataByKey({});
		setWarmFlags(null);
		series.forEach((s) => {
			fetchDayData(roomName, s.key).then((points) => {
				if (!cancelled) setDataByKey((prev) => ({ ...prev, [s.key]: points }));
			});
		});
		if (warmupVariable) {
			fetchDayFlags(roomName, warmupVariable).then((flags) => {
				if (!cancelled) setWarmFlags(flags);
			});
		}
		return () => {
			cancelled = true;
		};
		// seriesKeys is a stable stand-in for series (a fresh array/object each render)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomName, seriesKeys, warmupVariable]);

	function toggleKey(key: string) {
		setActiveKeys((prev) => {
			if (prev.has(key) && prev.size === 1) return prev; // keep at least one series visible
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});
	}

	const activeSeries = series.filter((s) => activeKeys.has(s.key));
	const stillLoading = activeSeries.some((s) => dataByKey[s.key] === undefined);
	// The gradient (and warmup segmentation) always apply to the designated
	// primary series — series[0] — regardless of which others are toggled on,
	// so e.g. toggling sIAQ on doesn't strip IAQ's own gradient.
	const primarySeries = series[0]!;
	const primaryActive = activeKeys.has(primarySeries.key);
	const useGradient = gradientStops != null && primaryActive;
	const primaryData = dataByKey[primarySeries.key] ?? null;
	const useWarmupSegments = !!warmupVariable && primaryActive && primaryData != null && warmFlags != null;

	// When the primary series has a gradient, treat the rest as thin companion
	// lines (no area fill) rather than competing filled areas — this is how
	// IAQ's gradient area + a plain white sIAQ line coexist on one axis.
	const otherSeries = activeSeries
		.filter((s) => s.key !== primarySeries.key)
		.map((s) => ({ label: s.label, data: dataByKey[s.key] ?? [], color: s.color, dashed: false, transparentArea: useGradient }));

	const primaryDataMax = primaryData && primaryData.length > 0 ? Math.max(...primaryData.map((d) => d.value)) : 0;
	const domainMax = yDomain?.max ?? primaryDataMax;

	// SVG's objectBoundingBox gradient normalizes to EACH path's own bounding
	// box. With warmup segmentation, every segment is a separate <path>, so a
	// single shared gradient would get re-stretched to each segment's own
	// local min/max — a segment that only ever reaches 120 would paint its
	// local top as "red" regardless of what 120 actually means on the real
	// 0-500 scale. Each segment needs its own gradient, resampled against its
	// own local max, so a given value always lands on the same absolute color.
	const gradientDefs: { id: string; stops: GradientStop[] }[] = [];
	function gradientUrlFor(segData: DayDataPoint[], index: number): string | null {
		if (!useGradient) return null;
		const segMax = segData.length > 0 ? Math.max(...segData.map((d) => d.value)) : 0;
		if (segMax <= 0) return null;
		const id = `${GRADIENT_ID}-${index}`;
		gradientDefs.push({ id, stops: resampleGradientStops(gradientStops!, domainMax, segMax) });
		return `url(#${id})`;
	}

	const primarySegments = !primaryActive
		? []
		: useWarmupSegments
			? segmentByWarmup(primaryData!, warmFlags!, primarySeries.color).map((seg, i) => ({
					label: seg.label,
					data: seg.data,
					color: seg.dashed ? seg.color : (gradientUrlFor(seg.data, i) ?? seg.color),
					dashed: seg.dashed,
					transparentArea: false,
				}))
			: [
					{
						label: primarySeries.label,
						data: primaryData ?? [],
						color: gradientUrlFor(primaryData ?? [], 0) ?? primarySeries.color,
						dashed: false,
						transparentArea: false,
					},
				];

	const chartData = [...primarySegments, ...otherSeries];
	const allEmpty = !stillLoading && chartData.every((s) => s.data.length === 0);
	// Multiple equal alternates (e.g. PM1/PM2.5/PM4/PM10) overlay as plain
	// lines to avoid muddy stacked fills; a gradient primary + its companions
	// stay on an "area" axis so the primary keeps its filled look.
	const elementType = useGradient || chartData.length <= 1 ? "area" : "line";

	return (
		<Modal onClose={onClose}>
			<div className="flex items-center justify-center gap-2 text-base font-semibold">
				<Icon src={icon} className="size-4" />
				<span>{title}</span>
			</div>

			<div className="mt-6">
				<div className="flex items-baseline gap-1">
					<p className="text-4xl font-medium leading-none font-mono">{value}</p>
					{unit && <p className="text-xl font-light text-white/70">{unit}</p>}
				</div>
				{subLabel && <p className="text-2xl font-light">{subLabel}</p>}
			</div>

			{series.length > 1 && (
				<div className="mt-4 flex flex-wrap gap-2">
					{series.map((s) => {
						const active = activeKeys.has(s.key);
						return (
							<button
								key={s.key}
								type="button"
								onClick={() => toggleKey(s.key)}
								className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
									active ? "bg-white/15 text-white" : "bg-white/5 text-white/50"
								}`}
							>
								<span className="size-2 rounded-full" style={{ backgroundColor: s.color, opacity: active ? 1 : 0.4 }} />
								{s.label}
							</button>
						);
					})}
				</div>
			)}

			<div className="mt-4 h-64">
				{stillLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-white/50">Načítavam...</div>
				) : allEmpty ? (
					<div className="flex h-full items-center justify-center text-sm text-white/50">
						Pre dnešný deň nie sú dostupné žiadne dáta.
					</div>
				) : (
					<Chart
						options={{
							dark: true,
							data: chartData,
							primaryAxis: {
								getValue: (d: DayDataPoint) => d.time,
								scaleType: "time",
								showGrid: true,
								tickCount: 4,
								formatters: {
									scale: (date: Date) => HOUR_FORMATTER.format(date),
								},
								min: todayBounds()[0],
								max: todayBounds()[1],
							},
							secondaryAxes: [
								{
									getValue: (d: DayDataPoint) => d.value,
									elementType,
									// react-charts auto-stacks an "area" axis whenever `stacked` is
									// left unset, summing overlapping series instead of overlaying them.
									stacked: false,
									showGrid: true,
									min: yDomain?.min,
									max: yDomain?.max,
								},
							],
							renderSVG: gradientDefs.length > 0
								? () => (
										<defs>
											{gradientDefs.map((def) => (
												<linearGradient key={def.id} id={def.id} x1="0" y1="0" x2="0" y2="1">
													{def.stops.map((stop) => (
														<stop key={stop.offset} offset={`${stop.offset}%`} stopColor={stop.color} />
													))}
												</linearGradient>
											))}
										</defs>
									)
								: undefined,
							getSeriesStyle: (ser) => {
								const original = ser.originalSeries as { color: string; dashed?: boolean; transparentArea?: boolean };
								if (original.dashed) {
									return {
										line: { stroke: "#9CA3AF", strokeWidth: 2, strokeDasharray: "6 4" },
										area: { fill: original.color, opacity: 0.08 },
									};
								}
								if (original.transparentArea) {
									return {
										line: { stroke: original.color, strokeWidth: 1.5 },
										area: { fill: "transparent", opacity: 0 },
									};
								}
								return {
									line: { stroke: original.color, strokeWidth: 2 },
									area: { fill: original.color, opacity: 0.2 },
								};
							},
						}}
					/>
				)}
			</div>

			{summary && <p className="mt-4 text-sm text-white/60">{summary}</p>}

			{mainFactor && (
				<div className="mt-6">
					<h3 className="font-semibold">Hlavný faktor</h3>
					{mainFactor.subtitle && <p className="text-xs text-white/50">{mainFactor.subtitle}</p>}
					<p className="mt-1 text-sm text-white/70 italic">{mainFactor.text}</p>
				</div>
			)}

			{details && details.length > 0 && (
				<div className="mt-6">
					<h3 className="font-semibold">Detaily</h3>
					<div className="mt-2 divide-y divide-white/10 rounded-xl bg-white/5">
						{details.map((row) => (
							<div key={row.abbr} className="flex items-center justify-between px-4 py-2.5 text-sm">
								<div className="flex items-baseline gap-3">
									<span className="w-12 shrink-0 text-xs text-white/50">{row.abbr}</span>
									<span className="font-medium">{row.label}</span>
								</div>
								<span className="font-mono text-white/70">
									{row.value != null ? `${Math.round(row.value * 100) / 100}${row.unit ?? ""}` : "--"}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{children}
		</Modal>
	);
}
