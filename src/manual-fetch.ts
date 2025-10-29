import env from "#config/env/env.js";
import { WbApiService } from "#services/wb.service.js";
import { DatabaseService } from "#services/db.service.js";
import { GoogleSheetsService } from "#services/google-sheets.service.js";

async function main() {
    const today = new Date().toISOString().split("T")[0];

    if (!env.WB_API_TOKEN) throw new Error("WB_API_TOKEN обязателен для работы приложения");

    const wb = new WbApiService();
    const db = new DatabaseService();

    try {
        console.log(`[manual] Получаем тарифы коробок для WB за ${today}...`);

        const tariffs = await wb.getBoxTariffs(today);

        console.log(`[manual] Получено ${tariffs.length} записей`);

        const seen = new Set<string>();
        const deduped = tariffs.filter((t) => {
            const key = `${today}::${t.warehouseName}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (deduped.length !== tariffs.length) {
            console.log(`[manual] Дедуплицировано ${tariffs.length - deduped.length} дубликатов по ключу (date, warehouse)`);
        }

        console.log(`[manual] Загрузка в базу данных...`);
        await db.clearBoxTariffs();
        await db.saveOrUpdateBoxTariffs(today, deduped);

        console.log(`[manual] База данных обновлена`);

        if (env.GOOGLE_SHEETS_CREDENTIALS && env.SPREADSHEET_IDS) {
            const sheets = new GoogleSheetsService(env.GOOGLE_SHEETS_CREDENTIALS);
            const actual = await db.getActualTariffs();
            const spreadsheetIds = env.SPREADSHEET_IDS.split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            for (const id of spreadsheetIds) {
                console.log(`[manual] Обновлена Google Таблица с id:${id}...`);
                await sheets.updateSheet(id, actual);
            }
            console.log(`[manual] Google Таблицы обновлены: (${spreadsheetIds.length})`);
        } else {
            console.log(`[manual] GOOGLE_SHEETS_CREDENTIALS или SPREADSHEET_IDS не подключены, пропуск обновления Google Таблиц`);
        }

        console.log(`[manual] Завершено`);
    } finally {
        db.destroy();
    }
}

main().catch((err) => {
    console.error("[manual] Не завершено:", err);
    process.exit(1);
});
