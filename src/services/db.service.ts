import knex, { Knex } from "knex";
import knexConfigs from "#config/knex/knexfile.js";
import { parseDecimal } from "#utils/parsers.js";
import { WarehouseTariff } from "#types/wb.type.js";
import { getLogger } from "#utils/logger.js";

const log = getLogger("db");

export class DatabaseService {
    private db: Knex;

    constructor() {
        this.db = knex(knexConfigs);
    }

    async checkConnection(): Promise<void> {
        log.info("Проверка подключения к БД...");
        await this.db.raw("select 1");
        log.info("Подключение к БД установлено");
    }

    async clearBoxTariffs(): Promise<void> {
        log.warn("Очистка таблицы box_tariffs");
        await this.db("box_tariffs").del();
    }

    async saveOrUpdateBoxTariffs(date: string, tariffs: WarehouseTariff[]): Promise<void> {
        log.info("Сохранение тарифов: %d записей на %s", tariffs.length, date);
        await this.db.transaction(async (trx) => {
            for (const tariff of tariffs) {
                const tariffData = {
                    date,
                    warehouse_name: tariff.warehouseName,
                    geo_name: tariff.geoName,
                    box_delivery_base: parseDecimal(tariff.boxDeliveryBase),
                    box_delivery_coef_expr: parseDecimal(tariff.boxDeliveryCoefExpr),
                    box_delivery_liter: parseDecimal(tariff.boxDeliveryLiter),
                    box_delivery_marketplace_base: parseDecimal(tariff.boxDeliveryMarketplaceBase),
                    box_delivery_marketplace_coef_expr: parseDecimal(tariff.boxDeliveryMarketplaceCoefExpr),
                    box_delivery_marketplace_liter: parseDecimal(tariff.boxDeliveryMarketplaceLiter),
                    box_storage_base: parseDecimal(tariff.boxStorageBase),
                    box_storage_coef_expr: parseDecimal(tariff.boxStorageCoefExpr),
                    box_storage_liter: parseDecimal(tariff.boxStorageLiter),
                    updated_at: this.db.fn.now(),
                };

                const updatedRows = await trx("box_tariffs").where({ date, warehouse_name: tariff.warehouseName }).update(tariffData);

                if (updatedRows === 0) {
                    await trx("box_tariffs").insert(tariffData);
                }
            }
        });
        log.info("Сохранение тарифов завершено");
    }

    async getActualTariffs(): Promise<any[]> {
        log.debug("Запрос актуальных тарифов");
        return this.db("box_tariffs").where("date", this.db.raw("(SELECT MAX(date) FROM box_tariffs)")).orderBy("box_storage_coef_expr", "asc");
    }

    destroy(): void {
        log.info("Закрытие соединения с БД");
        this.db.destroy();
    }
}
