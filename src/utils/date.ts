export function formatAsYMD(value: unknown): string {
	if (typeof value === "string") {
		const isoIdx = value.indexOf("T");
		return isoIdx > 0 ? value.slice(0, isoIdx) : value;
	}
	if (value instanceof Date) {
		return value.toISOString().split("T")[0];
	}
	return new Date().toISOString().split("T")[0];
}
