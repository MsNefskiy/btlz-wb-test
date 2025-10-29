/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("box_tariffs")
        .insert([{ id: 1 }])
        .onConflict(["id"])
        .ignore();
}
