import knex, { Knex } from "knex";
import knexConfigs from "#config/knex/knexfile.js";
import { parseDecimal } from "#utils/parsers.js";
import { WarehouseTariff } from "#types/wb.type.js";

export class DatabaseService {
    private db: Knex;

    constructor() {
        this.db = knex(knexConfigs);
    }

    async clearBoxTariffs(): Promise<void> {
        await this.db("box_tariffs").del();
    }

    async saveOrUpdateBoxTariffs(date: string, tariffs: WarehouseTariff[]): Promise<void> {
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
    }

    async getActualTariffs(): Promise<any[]> {
        return this.db("box_tariffs").where("date", this.db.raw("(SELECT MAX(date) FROM box_tariffs)"))
            .orderBy("box_storage_coef_expr", "asc");
    }

    destroy(): void {
        this.db.destroy();
    }
}
