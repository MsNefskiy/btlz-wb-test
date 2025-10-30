export function isValidCron(expression: string | undefined): boolean {
    if (!expression) return false;

    const parts = expression.trim().split(/\s+/);

    if (!(parts.length === 5 || parts.length === 6)) return false;
    const fieldRe = /^[0-9A-Za-z*,/\-?#LW]+$/;
    
    return parts.every((p) => fieldRe.test(p));
}

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
