import { google, sheets_v4 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { getLogger } from "#utils/logger.js";
import { formatAsYMD } from "#utils/date.js";

const log = getLogger("sheets");
const SHEET_NAME = "stocks_coefs";

export class GoogleSheetsService {
    private sheets: sheets_v4.Sheets;
    private auth: GoogleAuth;

    constructor(credentialsPath: string) {
        this.auth = new GoogleAuth({
            keyFile: credentialsPath,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        this.sheets = google.sheets({ version: "v4", auth: this.auth });
        log.info("Инициализирован Google Sheets клиент: %s", credentialsPath);
    }

    private async ensureSheet(spreadsheetId: string, sheetName: string): Promise<number> {
        const response = await this.sheets.spreadsheets.get({ spreadsheetId });
        const sheet = response.data.sheets?.find((s) => s.properties?.title === sheetName);
        if (sheet?.properties?.sheetId != null) {
            return sheet.properties.sheetId;
        }
        log.warn("Лист %s не найден, создаю...", sheetName);
        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: { title: sheetName },
                            },
                        },
                    ],
                },
            });
        } catch (error: any) {
            log.warn("Добавление листа %s: %s", sheetName, error?.message || error);
        }
        const after = await this.sheets.spreadsheets.get({ spreadsheetId });
        const created = after.data.sheets?.find((s) => s.properties?.title === sheetName);
        if (!created?.properties?.sheetId) {
            throw new Error(`Не удалось создать лист ${sheetName}`);
        }
        return created.properties.sheetId;
    }

    async updateSheet(spreadsheetId: string, data: any[]): Promise<void> {
        try {
            const sheetId = await this.ensureSheet(spreadsheetId, SHEET_NAME);
            log.debug("Лист %s готов (sheetId=%s)", SHEET_NAME, String(sheetId));

            const headers = [["Дата", "Склад", "Регион", "Коэф. доставки", "Коэф. хранения"]];

            const values = data.map((row) => [
                formatAsYMD(row.date),
                row.warehouse_name,
                row.geo_name,
                row.box_delivery_coef_expr,
                row.box_storage_coef_expr,
            ]);

            const allData = [...headers, ...values];

            log.info("Обновление листа %s в таблице %s, строк: %d", SHEET_NAME, spreadsheetId, allData.length);
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${SHEET_NAME}!A1:E`,
                valueInputOption: "RAW",
                requestBody: {
                    values: allData,
                },
            });

            log.info(`Данные успешно обновлены в таблице ${spreadsheetId}`);
        } catch (error) {
            log.error("Ошибка при обновлении Google Sheets:", error);
            throw error;
        }
    }
}
