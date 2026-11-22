export function snakeToCamel(key: string) {
	return key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

export function camelizeKeys(value: unknown) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return value;

	return Object.fromEntries(Object.entries(value).map(([key, val]) => [snakeToCamel(key), val]));
}