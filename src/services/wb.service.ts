import env from "#config/env/env.js";
import { BoxTariffResponse, WarehouseTariff } from "#types/wb.type.js";
import axios, { AxiosInstance } from "axios";
import { getLogger } from "#utils/logger.js";

const log = getLogger("wb");

export class WbApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: "https://common-api.wildberries.ru/api/v1/tariffs",
            headers: {
                "Authorization": `Bearer ${env.WB_API_TOKEN}`,
                "Content-Type": "application/json",
            },
        });
    }

    async getBoxTariffs(date: string): Promise<WarehouseTariff[]> {
        try {
            log.info("WB API: запрос box тарифов на дату %s", date);
            const response = await this.client.get<BoxTariffResponse>(`/box?date=${date}`);
            const list = response.data.response.data.warehouseList;
            log.info("WB API: получено %d складов", list.length);
            return list;
        } catch (error) {
            log.error("WB API: ошибка получения box тарифов:", error);
            throw new Error("Failed to get box tariffs");
        }
    }
}
