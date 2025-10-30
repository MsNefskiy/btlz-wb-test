# WB Tariff Service

Сервис для регулярного получения тарифов Wildberries и выгрузки в Google Sheets.

## Содержание
- Требования
- Быстрый старт (Docker)
- Dev-режим (локально)
- Конфигурация (.env, переменные)
- Google Sheets (credentials, права, лист)
- Миграции и сиды
- Планировщик (CRON)
- Ручной прогон без планировщика
- Логи
- Шаблонные файлы в репозитории


## Требования
- Docker Desktop 4.x+ (или совместимый docker/compose)
- Node.js 20+ (для локального dev)
- Доступ к Google Cloud (Service Account JSON)

## Быстрый старт (Docker)
1) Подготовьте .env (см. «Конфигурация»). Минимум:
```
NODE_ENV=production
APP_PORT=5000

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

WB_API_TOKEN=<ваш_токен_WB>
GOOGLE_SHEETS_CREDENTIALS=/app/credentionals.json
SPREADSHEET_IDS=<spreadsheetId_1>[,<spreadsheetId_2>,...]

# CRON (опционально; при отсутствии подставятся дефолты)
TARIFFS_CRON=0 * * * *
SHEETS_CRON=5 */6 * * *

```

2) Положите `credentionals.json` сервис-аккаунта Google в корень проекта.
   - В `compose.yaml` уже настроен bind-mount: `./credentionals.json:/app/credentionals.json:ro`

3) Запуск:
```
docker compose up -d --build
```

4) Логи:
```
docker compose logs -f app
```

## Dev-режим (локально)
1) Установите зависимости:
```
npm i
```
2) Поднимите Postgres в docker:
```
docker compose up -d postgres
```
3) Dev-запуск приложения:
```
npm run dev
```

## Конфигурация
Часть переменных читается из `.env` (см. пример ниже). Вместо `.env.example` используйте `env.example` как ориентир.

Ключевые переменные:
- `NODE_ENV`: development | production
- `APP_PORT`: порт приложения
- `POSTGRES_*`: доступ к БД
- `WB_API_TOKEN`: токен WB API (обязателен)
- `GOOGLE_SHEETS_CREDENTIALS`: путь к JSON сервис-аккаунта Google (в контейнере: `/app/credentionals.json`)
- `SPREADSHEET_IDS`: ID Google Sheets через запятую
- `TARIFFS_CRON`/`SHEETS_CRON`: CRON-строки для планировщика (см. «Планировщик»)

Пример `.env` (прод):
```
NODE_ENV=production
APP_PORT=5000
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
WB_API_TOKEN=__REQUIRED__
GOOGLE_SHEETS_CREDENTIALS=/app/credentionals.json
SPREADSHEET_IDS=
TARIFFS_CRON=0 * * * *
SHEETS_CRON=5 */6 * * *
```

## Google Sheets
1) Создайте Google Sheet(ы), возьмите `spreadsheetId` из URL.
2) Сервис-аккаунт (JSON): создайте в Google Cloud → IAM → Service Accounts → Keys → JSON.
3) Дайте доступ «Редактор» на таблицу по `client_email` сервис-аккаунта.
4) В коде имя листа для тарифов — `stocks_coefs`. Если листа нет, он создаётся автоматически.

## Миграции и сиды
- Применяются автоматически при старте (`migrate.latest` + `seed.run`).
- Сид `box_tariffs` соответствует схеме и очищает таблицу перед вставкой.
- Из контейнера:
```
docker compose exec app node dist/utils/knex.js migrate:latest
/docker compose exec app node dist/utils/knex.js seed:run
```
- Из dev (TS):
```
npm run knex:dev migrate latest
npm run knex:dev seed run
```

## Планировщик (CRON)
- На старте поднимается `Scheduler` (node-schedule).
- Маски читаются из `env.TARIFFS_CRON`/`env.SHEETS_CRON`.
- Валидация: если маска невалидна или отсутствует — применяется дефолт:
  - Тарифы: `0 * * * *` (каждый час)
  - Sheets: `5 */6 * * *` (каждые 6 часов на 05 мин)
- Рекомендации:
  - Dev: `TARIFFS_CRON=*/2 * * * *`, `SHEETS_CRON=*/5 * * * *`
  - Prod: как в дефолтах выше

## Ручной прогон без планировщика
Для разовой проверки WB→DB→Sheets (без ожидания CRON):
```
docker compose exec app node dist/manual-fetch.js
```
Скрипт:
- тянет тарифы за сегодня;
- чистит таблицу `box_tariffs` и перезаписывает актуальными данными;
- при наличии `GOOGLE_SHEETS_CREDENTIALS`/`SPREADSHEET_IDS` обновляет лист `stocks_coefs`.

## Логи
Используется `log4js` с ротацией файлов и уровнями:
- Консоль + файлы: `logs/app.log`, `logs/error.log`
- Формат времени: `[YYYY-MM-DD HH:mm:ss] [LEVEL] category - message`
- Управление уровнем: `LOG_LEVEL` (по умолчанию `info`)

---

## Шаблонные файлы в репозитории
- `credentionals.example.json` — образец структуры ключа сервис-аккаунта (без секретов).
- `env.example` (если используется) — ориентир по переменным окружения (без секретов).


