import { google, sheets_v4 } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export class GoogleSheetsService {
    private sheets: sheets_v4.Sheets;
    private auth: GoogleAuth;

    constructor(credentialsPath: string) {
        this.auth = new GoogleAuth({
            keyFile: credentialsPath,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        this.sheets = google.sheets({ version: "v4", auth: this.auth });
    }

    private formatDate(value: unknown): string {
        if (typeof value === "string") {
            const isoIdx = value.indexOf("T");
            return isoIdx > 0 ? value.slice(0, isoIdx) : value;
        }
        if (value instanceof Date) {
            return value.toISOString().split("T")[0];
        }
        return new Date().toISOString().split("T")[0];
    }

    async updateSheet(spreadsheetId: string, data: any[]): Promise<void> {
        try {
            const headers = [["Дата", "Склад", "Регион", "Коэф. доставки", "Коэф. хранения"]];

            const values = data.map((row) => [
                this.formatDate(row.date),
                row.warehouse_name,
                row.geo_name,
                row.box_delivery_coef_expr,
                row.box_storage_coef_expr,
            ]);

            const allData = [...headers, ...values];

            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "stocks_coefs!A1:E",
                valueInputOption: "RAW",
                requestBody: {
                    values: allData,
                },
            });

            console.log(`Данные успешно обновлены в таблице ${spreadsheetId}`);
        } catch (error) {
            console.error("Ошибка при обновлении Google Sheets:", error);
            throw error;
        }
    }
}
