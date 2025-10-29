import env from "#config/env/env.js";
import type { Knex } from "knex";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionSchema = z.object({
    host: z.string(),
    port: z.number(),
    database: z.string(),
    user: z.string(),
    password: z.string(),
});

const NODE_ENV = env.NODE_ENV ?? "development";

const knexConfigs: Record<typeof NODE_ENV, Knex.Config> = {
    development: {
        client: "pg",
        connection: () =>
            connectionSchema.parse({
                host: env.POSTGRES_HOST ?? "localhost",
                port: env.POSTGRES_PORT ?? 5432,
                database: env.POSTGRES_DB ?? "postgres",
                user: env.POSTGRES_USER ?? "postgres",
                password: env.POSTGRES_PASSWORD ?? "postgres",
            }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: path.resolve(__dirname, "migration.stub.js"),
            directory: path.resolve(__dirname, "../../../src/postgres/migrations"),
            tableName: "migrations",
            extension: "ts",
        },
        seeds: {
            stub: path.resolve(__dirname, "seed.stub.js"),
            directory: path.resolve(__dirname, "../../../src/postgres/seeds"),
            extension: "js",
        },
    },
    production: {
        client: "pg",
        connection: () =>
            connectionSchema.parse({
                host: env.POSTGRES_HOST,
                port: env.POSTGRES_PORT,
                database: env.POSTGRES_DB,
                user: env.POSTGRES_USER,
                password: env.POSTGRES_PASSWORD,
            }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: path.resolve(__dirname, "../../../../dist/config/knex/migration.stub.js"),
            directory: path.resolve(__dirname, "../../../../dist/postgres/migrations"),
            tableName: "migrations",
            extension: "js",
        },
        seeds: {
            stub: path.resolve(__dirname, "seed.stub.js"),
            directory: path.resolve(__dirname, "../../../../dist/postgres/seeds"),
            extension: "js",
        },
    },
};

export default knexConfigs[NODE_ENV];
