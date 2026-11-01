import { useState } from "react";
import { MEASUREMENTS_BASE } from "../lib/dayData";
import { Modal } from "./Modal";

interface CsvExportModalProps {
	roomNames: string[];
	onClose: () => void;
}

const VALUE_COLUMNS = [
	{ key: "temperature", label: "Teplota", type: "number" },
	{ key: "humidity", label: "Vlhkosť", type: "number" },
	{ key: "pressureHpa", label: "Tlak", type: "number" },
	{ key: "iaq", label: "IAQ", type: "number" },
	{ key: "staticIaq", label: "sIAQ", type: "number" },
	{ key: "iaqAccuracy", label: "Presnosť IAQ", type: "number" },
	{ key: "eco2Ppm", label: "eCO₂", type: "number" },
	{ key: "bvocPpm", label: "bVOC", type: "number" },
	{ key: "compensatedGasOhm", label: "Odpor plynu", type: "number" },
	{ key: "gasPercentage", label: "Percento plynu", type: "number" },
	{ key: "warmingUp", label: "Zahrievanie", type: "boolean" },
	{ key: "lux", label: "Lux", type: "number" },
	{ key: "noiseDbRel", label: "Hluk", type: "number" },
	{ key: "dustMgm3", label: "Prach", type: "number" },
	{ key: "pm100Ugm3", label: "PM10", type: "number" },
	{ key: "pm25Ugm3", label: "PM2.5", type: "number" },
	{ key: "pm40Ugm3", label: "PM4.0", type: "number" },
	{ key: "pm10Ugm3", label: "PM1.0", type: "number" },
	{ key: "co2Ppm", label: "CO2", type: "number" },
	{ key: "nearbyDevices", label: "Zariadenia", type: "number" },
	{ key: "dewPointC", label: "Rosný bod", type: "number" },
	{ key: "absHumidityGm3", label: "Abs. vlhkosť", type: "number" },
	{ key: "moldRiskIndex", label: "Riziko plesne", type: "number" },
	{ key: "heatIndexC", label: "Heat index", type: "number" },
] as const;

const NUMBER_OPERATORS = [
	{ key: "eq", label: "=", arity: "single" },
	{ key: "ne", label: "≠", arity: "single" },
	{ key: "gt", label: ">", arity: "single" },
	{ key: "gte", label: "≥", arity: "single" },
	{ key: "lt", label: "<", arity: "single" },
	{ key: "lte", label: "≤", arity: "single" },
	{ key: "between", label: "medzi", arity: "pair" },
	{ key: "in", label: "jedna z (oddelené čiarkou)", arity: "list" },
	{ key: "notIn", label: "žiadna z (oddelené čiarkou)", arity: "list" },
	{ key: "isNull", label: "je prázdne", arity: "none" },
	{ key: "isNotNull", label: "nie je prázdne", arity: "none" },
] as const;

const BOOLEAN_OPERATORS = [
	{ key: "eq", label: "=", arity: "single" },
	{ key: "ne", label: "≠", arity: "single" },
	{ key: "isNull", label: "je prázdne", arity: "none" },
	{ key: "isNotNull", label: "nie je prázdne", arity: "none" },
] as const;

interface ValueFilterRow {
	id: number;
	column: string;
	operator: string;
	value: string;
	value2: string;
}

let nextRowId = 0;

function columnType(column: string): "number" | "boolean" {
	return VALUE_COLUMNS.find((c) => c.key === column)?.type ?? "number";
}

function operatorsFor(column: string) {
	return columnType(column) === "boolean" ? BOOLEAN_OPERATORS : NUMBER_OPERATORS;
}

function parseValue(column: string, raw: string): unknown {
	if (columnType(column) === "boolean") return raw === "true";
	const num = Number(raw);
	return raw.trim() !== "" && !Number.isNaN(num) ? num : raw;
}

export function CsvExportModal({ roomNames, onClose }: CsvExportModalProps) {
	const [room, setRoom] = useState("all");
	const [from, setFrom] = useState<string | null>(null);
	const [to, setTo] = useState<string | null>(null);
	const [valueFilters, setValueFilters] = useState<ValueFilterRow[]>([]);

	function addFilterRow() {
		const column = VALUE_COLUMNS[0]!.key;
		setValueFilters((rows) => [
			...rows,
			{ id: nextRowId++, column, operator: operatorsFor(column)[0].key, value: "", value2: "" },
		]);
	}

	function updateRow(id: number, patch: Partial<ValueFilterRow>) {
		setValueFilters((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
	}

	function removeRow(id: number) {
		setValueFilters((rows) => rows.filter((row) => row.id !== id));
	}

	function buildUrl(): string {
		const filter: Record<string, Record<string, unknown>> = {};
		if (room !== "all") filter.room = { eq: room };
		if (from && to) {
			filter.timestamp = { between: [from, to] };
		} else if (from) {
			filter.timestamp = { gte: from };
		} else if (to) {
			filter.timestamp = { lte: to };
		}

		for (const row of valueFilters) {
			const opMeta = operatorsFor(row.column).find((o) => o.key === row.operator);
			if (!opMeta) continue;
			if (opMeta.arity === "none") {
				filter[row.column] = { [row.operator]: true };
			} else if (opMeta.arity === "pair") {
				if (row.value.trim() === "" || row.value2.trim() === "") continue;
				filter[row.column] = { [row.operator]: [parseValue(row.column, row.value), parseValue(row.column, row.value2)] };
			} else if (opMeta.arity === "list") {
				if (row.value.trim() === "") continue;
				filter[row.column] = {
					[row.operator]: row.value.split(",").map((v) => parseValue(row.column, v.trim())),
				};
			} else {
				if (row.value.trim() === "") continue;
				filter[row.column] = { [row.operator]: parseValue(row.column, row.value) };
			}
		}

		const params = new URLSearchParams({ format: "csv" });
		if (Object.keys(filter).length > 0) params.set("filter", JSON.stringify(filter));
		return `${MEASUREMENTS_BASE}/measurements?${params.toString()}`;
	}

	return (
		<Modal onClose={onClose}>
			<h2 className="text-base font-semibold text-center">Export do CSV</h2>

			<div className="mt-6 space-y-4">
				<label className="block">
					<span className="text-xs text-white/60">Miestnosť</span>
					<select
						value={room}
						onChange={(e) => setRoom(e.target.value)}
						className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
					>
						<option value="all" className="text-black">
							Všetky miestnosti
						</option>
						{roomNames.map((name) => (
							<option key={name} value={name} className="text-black">
								{name}
							</option>
						))}
					</select>
				</label>

				<div className="flex gap-3">
					<label className="block flex-1">
						<span className="text-xs text-white/60">Od</span>
						<input
							type="datetime-local"
							value={from}
							onChange={(e) => { console.log(e.target.value); setFrom(e.target.value) }}
							className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
						/>
					</label>
					<label className="block flex-1">
						<span className="text-xs text-white/60">Do</span>
						<input
							type="datetime-local"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
						/>
					</label>
				</div>
			</div>

			<div className="mt-6">
				<div className="flex items-center justify-between">
					<span className="text-xs text-white/60">Filtre podľa hodnôt</span>
					<button
						type="button"
						onClick={addFilterRow}
						className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20"
					>
						+ Pridať filter
					</button>
				</div>

				<div className="mt-2 space-y-2">
					{valueFilters.map((row) => {
						const ops = operatorsFor(row.column);
						const opMeta = ops.find((o) => o.key === row.operator) ?? ops[0];
						return (
							<div key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 p-2">
								<select
									value={row.column}
									onChange={(e) => {
										const column = e.target.value;
										updateRow(row.id, { column, operator: operatorsFor(column)[0].key, value: "", value2: "" });
									}}
									className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
								>
									{VALUE_COLUMNS.map((c) => (
										<option key={c.key} value={c.key} className="text-black">
											{c.label}
										</option>
									))}
								</select>

								<select
									value={row.operator}
									onChange={(e) => updateRow(row.id, { operator: e.target.value, value: "", value2: "" })}
									className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
								>
									{ops.map((o) => (
										<option key={o.key} value={o.key} className="text-black">
											{o.label}
										</option>
									))}
								</select>

								{opMeta.arity !== "none" &&
									(columnType(row.column) === "boolean" ? (
										<select
											value={row.value}
											onChange={(e) => updateRow(row.id, { value: e.target.value })}
											className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
										>
											<option value="" className="text-black" />
											<option value="true" className="text-black">
												áno
											</option>
											<option value="false" className="text-black">
												nie
											</option>
										</select>
									) : (
										<input
											type="text"
											value={row.value}
											onChange={(e) => updateRow(row.id, { value: e.target.value })}
											placeholder={opMeta.arity === "list" ? "napr. 1, 2, 3" : "hodnota"}
											className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
										/>
									))}

								{opMeta.arity === "pair" && (
									<input
										type="text"
										value={row.value2}
										onChange={(e) => updateRow(row.id, { value2: e.target.value })}
										placeholder="do"
										className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
									/>
								)}

								<button
									type="button"
									onClick={() => removeRow(row.id)}
									className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
								>
									✕
								</button>
							</div>
						);
					})}
				</div>
			</div>

			<a
				href={buildUrl()}
				target="_blank"
				rel="noreferrer"
				onClick={onClose}
				className="mt-6 flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
			>
				Stiahnuť CSV
			</a>
		</Modal>
	);
}
