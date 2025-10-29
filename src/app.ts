import env from "#config/env/env.js";
import { Scheduler } from "#jobs/scheduler.job.js";
import knex, { migrate, seed } from "#postgres/knex.js";
import { DatabaseService } from "#services/db.service.js";
import { WbApiService } from "#services/wb.service.js";
import { GoogleSheetsService } from "#services/google-sheets.service.js";

await migrate.latest();
await seed.run();

async function main() {
    if (!env.WB_API_TOKEN) {
        throw new Error("WB_API_TOKEN не установлен в .env файле");
    }

    const dbService = new DatabaseService();
    const scheduler = new Scheduler();

    try {
        const wb = new WbApiService();
        const today = new Date().toISOString().split("T")[0];
        const tariffs = await wb.getBoxTariffs(today);
        await dbService.saveOrUpdateBoxTariffs(today, tariffs);

        if (env.GOOGLE_SHEETS_CREDENTIALS && env.SPREADSHEET_IDS) {
            const sheetsService = new GoogleSheetsService(env.GOOGLE_SHEETS_CREDENTIALS);
            const actual = await dbService.getActualTariffs();
            const spreadsheetIds = env.SPREADSHEET_IDS.split(",").map((s) => s.trim()).filter(Boolean);
            for (const id of spreadsheetIds) {
                await sheetsService.updateSheet(id, actual);
            }
        }
        console.log("Начальная синхронизация завершена");
    } catch (error) {
        console.error("Ошибка начальной синхронизации:", error);
    }

    scheduler.start();
    console.log("Сервис мониторинга тарифов WB запущен");

    process.on("SIGINT", () => {
        console.log("Остановка сервиса...");
        dbService.destroy();
        process.exit(0);
    });
}

main().catch(console.error);

console.log("All migrations and seeds have been run");
