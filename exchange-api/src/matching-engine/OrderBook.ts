export type Order = {
    id: string,
    userId: string,
    side: "BUY" | "SELL",
    price: number,
    quantity: number,
    timestamp: number
};

export type OrderBookSide = Map<number, Order[]>;

export type Trade = {
    buyOrderId: string,
    sellOrderId: string,
    price: number,
    quantity: number
};

export type OrderResult = {
    order: Order,
    trades?: Trade[],
    remainingQuantity: number
}

