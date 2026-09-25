import { describe, expect, it } from "vitest";
import { Exchange } from "../../../src/exchange-layer/Exchange.js";
import type { Order } from "../../../src/types/order.js";

describe("Exchange - placeOrder", () => {
    it("should match and settle a buy and sell order", () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const buyer = exchange.createAccount("buyer1");
        const seller = exchange.createAccount("seller1");

        buyer.balance = 10_000;
        seller.holdings.set("AAPL", 100);

        const sellOrder: Order = {
            id: "sell-order-1",
            userId: "seller1",
            stockId: "AAPL",
            side: "SELL",
            price: 95,
            originalQuantity: 40,
            quantity: 40,
            timestamp: Date.now(),
            status: "OPEN",
        };

        const buyOrder: Order = {
            id: "buy-order-1",
            userId: "buyer1",
            stockId: "AAPL",
            side: "BUY",
            price: 100,
            originalQuantity: 40,
            quantity: 40,
            timestamp: Date.now(),
            status: "OPEN",
        };

        exchange.placeOrder(sellOrder);
        const result = exchange.placeOrder(buyOrder);

        expect(result.trades).toHaveLength(1);

        const trade = result.trades[0];

        expect(trade!.stockId).toBe("AAPL");
        expect(trade!.quantity).toBe(40);
        expect(trade!.price).toBe(95);

        expect(buyer.balance).toBe(6200);
        expect(buyer.lockedBalance).toBe(0);
        expect(buyer.holdings.get("AAPL")).toBe(40);

        expect(seller.balance).toBe(3_800);
        expect(seller.lockedHoldings.get("AAPL")).toBe(0);
        expect(seller.holdings.get("AAPL")).toBe(60);
    });
});