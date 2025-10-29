export function parseDecimal(value: string | null | undefined): number | null {
    if (value == null) {
        return null;
    }

    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-") {
        return null;
    }

    try {
        const normalizedValue = parseFloat(trimmed.replace(",", "."));
        if (isNaN(normalizedValue)) {
            return null;
        }
        return normalizedValue;
    } catch {
        return null;
    }
}
