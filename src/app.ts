import env from "#config/env/env.js";
import { Scheduler } from "#jobs/scheduler.job.js";
import { migrate, seed } from "#postgres/knex.js";
import { DatabaseService } from "#services/db.service.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger("app");

async function bootstrap() {
    logger.info("App starting... NODE_ENV=%s LOG_LEVEL=%s", env.NODE_ENV ?? "development", process.env.LOG_LEVEL ?? "info");

    if (!env.WB_API_TOKEN) {
        throw new Error("WB_API_TOKEN не установлен в .env файле");
    }

    const dbService = new DatabaseService();
    await dbService.checkConnection();

    logger.info("Running migrations...");
    await migrate.latest();
    logger.info("Migrations completed");

    logger.info("Running seeds...");
    await seed.run();
    logger.info("Seeds completed");

    const scheduler = new Scheduler();

    scheduler.start();
    logger.info("Сервис мониторинга тарифов WB запущен");

    const shutdown = (signal: string) => async () => {
        try {
            logger.warn("Received %s. Shutting down...", signal);
            dbService.destroy();
        } catch (e) {
            logger.error("Shutdown error:", e);
        } finally {
            process.exit(0);
        }
    };

    process.on("SIGINT", shutdown("SIGINT"));
    process.on("SIGTERM", shutdown("SIGTERM"));

    process.on("uncaughtException", (err) => {
        logger.fatal("Uncaught exception:", err);
        process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
        logger.fatal("Unhandled rejection:", reason as any);
        process.exit(1);
    });
}

bootstrap().catch((err) => {
    logger.fatal("Bootstrap failed:", err);
    process.exit(1);
});
