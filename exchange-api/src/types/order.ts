import type { Trade } from "./trade.js";

export type OrderStatus = "OPEN" | "PARTIALLY FILLED" | "FILLED" | "CANCELLED"; 

export type Order = {
    id: string,
    userId: string,
    side: "BUY" | "SELL",
    price: number,
    quantity: number,
    originalQuantity: number,
    stockId: string,
    timestamp: number,
    status: OrderStatus
};

export type OrderBookSide = Map<number, Order[]>;

export type OrderResult = {
    order: Order,
    trades?: Trade[]
}

