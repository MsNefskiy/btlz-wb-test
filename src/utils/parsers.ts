export function parseDecimal(value: string): number {
    if (!value || typeof value !== "string") {
        throw new Error(`Invalid value for decimal parsing: ${value}`);
    }

    try {
        const normalizedValue = parseFloat(value.replace(",", "."));

        if (isNaN(normalizedValue)) {
            throw new Error(`Failed to parse value: ${value}`);
        }

        return normalizedValue;
    } catch (error) {
        console.error(`Error parsing decimal value: ${value}`, error);
        throw error;
    }
}
