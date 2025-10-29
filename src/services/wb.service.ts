import env from "#config/env/env.js";
import { BoxTariffResponse, WarehouseTariff } from "#types/wb.type.js";
import axios, { AxiosInstance } from "axios";

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
            const response = await this.client.get<BoxTariffResponse>(`/box?date=${date}`);
            return response.data.response.data.warehouseList;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to get box tariffs");
        }
    }
}
