export type Order = {
    id: string,
    userId: string,
    side: "BUY" | "SELL",
    price: number,
    quantity: number,
    timestamp: number
}

export type OrderBookSide = Map<number, Order[]>;

