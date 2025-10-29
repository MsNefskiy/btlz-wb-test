/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    // Полное обновление сидов: очищаем таблицу перед вставкой
    await knex("box_tariffs").del();

    await knex("box_tariffs")
        .insert([
            {
                id: 1,
                date: "2025-10-29",
                warehouse_name: "SomeWarehouse",
                geo_name: "SomeGeo",
                box_delivery_base: 100.1,
                box_delivery_coef_expr: 1.1,
                box_delivery_liter: 2.2,
                box_delivery_marketplace_base: 50.5,
                box_delivery_marketplace_coef_expr: 1.05,
                box_delivery_marketplace_liter: 1.99,
                box_storage_base: 30.0,
                box_storage_coef_expr: 0.95,
                box_storage_liter: 1.5,
            },
        ])
        .onConflict(["id"]) // при повторном запуске гарантируем перезапись
        .merge();
}
