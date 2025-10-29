import cron from "node-cron";
import { DatabaseService } from "#services/db.service.js";
import { WbApiService } from "#services/wb.service.js";
import env from "#config/env/env.js";
import { GoogleSheetsService } from "#services/google-sheets.service.js";

export class Scheduler {
    private wbApiService: WbApiService;
    private dbService: DatabaseService;

    constructor() {
        this.wbApiService = new WbApiService();
        this.dbService = new DatabaseService();
    }

    start(): void {
        cron.schedule("0 * * * *", async () => {
            console.log("Запуск ежечасного обновления тарифов...");
            await this.updateTariffs();
        });

        // Обновление Google Sheets каждые 6 часов (в 5 минут часа)
        cron.schedule("5 */6 * * *", async () => {
            console.log("Запуск обновления Google Sheets...");
            await this.updateGoogleSheets();
        });
    }

    private async updateTariffs(): Promise<void> {
        try {
            const today = new Date().toISOString().split("T")[0];

            const tariffs = await this.wbApiService.getBoxTariffs(today);

            await this.dbService.saveOrUpdateBoxTariffs(today, tariffs);

            console.log(`Успешно обновлены тарифы на ${today}. Получено записей: ${tariffs.length}`);
        } catch (error) {
            console.error("Ошибка при обновлении тарифов:", error);
        }
    }

    private async updateGoogleSheets(): Promise<void> {
        try {
            const sheetsService = new GoogleSheetsService(env.GOOGLE_SHEETS_CREDENTIALS);
            const tariffs = await this.dbService.getActualTariffs();

            const spreadsheetIds = env.SPREADSHEET_IDS?.split(",") || [];

            for (const spreadsheetId of spreadsheetIds) {
                await sheetsService.updateSheet(spreadsheetId.trim(), tariffs);
            }

            console.log(`Обновлено ${spreadsheetIds.length} таблиц`);
        } catch (error) {
            console.error("Ошибка при обновлении Google Sheets:", error);
        }
    }
}
