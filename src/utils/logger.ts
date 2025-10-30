import log4js from "log4js";

log4js.configure({
    appenders: {
        console: { 
            type: "stdout",
            layout: { type: "pattern", pattern: "[%d{YYYY-MM-DD HH:mm:ss}] [%p] %c - %m" }
        },
        app: {
            type: "dateFile",
            filename: "logs/app.log",
            pattern: "yyyy-MM-dd",
            keepFileExt: true,
            numBackups: 7,
            compress: true,
            layout: { type: "pattern", pattern: "[%d{YYYY-MM-DD HH:mm:ss}] [%p] %c - %m" }
        },
        errorFile: {
            type: "dateFile",
            filename: "logs/error.log",
            pattern: "yyyy-MM-dd",
            keepFileExt: true,
            numBackups: 14,
            compress: true,
            layout: { type: "pattern", pattern: "[%d{YYYY-MM-DD HH:mm:ss}] [%p] %c - %m" }
        },
        errFilter: { type: "logLevelFilter", appender: "errorFile", level: "error" },
    },
    categories: {
        default: { appenders: ["console", "app", "errFilter"], level: process.env.LOG_LEVEL || "info" },
        app: { appenders: ["console", "app", "errFilter"], level: process.env.LOG_LEVEL || "info" },
        scheduler: { appenders: ["console", "app", "errFilter"], level: process.env.LOG_LEVEL || "info" },
        db: { appenders: ["console", "app", "errFilter"], level: process.env.LOG_LEVEL || "info" },
        sheets: { appenders: ["console", "app", "errFilter"], level: process.env.LOG_LEVEL || "info" },
        wb: { appenders: ["console", "app", "errFilter"], level: process.env.LOG_LEVEL || "info" },
    },
});

export const getLogger = (category: string = "default") => log4js.getLogger(category);
