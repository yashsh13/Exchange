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

    it('cancels a BUY order and releases locked balance', () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const buyer = exchange.createAccount("bob");

        buyer.balance = 10_000;

        const order = {
            id: "1",
            userId: "bob",
            stockId: "AAPL",
            side: "BUY" as const,
            price: 100,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(order);

        // ₹4,000 should now be locked
        expect(buyer.balance).toBe(6_000);
        expect(buyer.lockedBalance).toBe(4_000);

        const cancelledOrder = exchange.cancelOrder(order.id);

        expect(cancelledOrder).toBe(order);
        expect(cancelledOrder.status).toBe("CANCELLED");

        // Locked money should be returned
        expect(buyer.balance).toBe(10_000);
        expect(buyer.lockedBalance).toBe(0);
    });

    it('cancels a SELL order and releases locked holdings', () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const seller = exchange.createAccount("bob");

        seller.holdings.set("AAPL", 100);

        const order = {
            id: "1",
            userId: "bob",
            stockId: "AAPL",
            side: "SELL" as const,
            price: 110,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(order);

        expect(seller.holdings.get("AAPL")).toBe(60);
        expect(seller.lockedHoldings.get("AAPL")).toBe(40);

        const cancelledOrder = exchange.cancelOrder(order.id);

        expect(cancelledOrder).toBe(order);
        expect(cancelledOrder.status).toBe("CANCELLED");

        expect(seller.holdings.get("AAPL")).toBe(100);
        expect(seller.lockedHoldings.get("AAPL")).toBe(0);
    });

    it('cancels a partially filled BUY order and releases only remaining locked balance', () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const buyer = exchange.createAccount("buyer");
        const seller = exchange.createAccount("seller");

        buyer.balance = 10_000;
        seller.holdings.set("AAPL", 40);

        const sellOrder = {
            id: "sell-1",
            userId: "seller",
            stockId: "AAPL",
            side: "SELL" as const,
            price: 95,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(sellOrder);

        const buyOrder = {
            id: "buy-1",
            userId: "buyer",
            stockId: "AAPL",
            side: "BUY" as const,
            price: 100,
            quantity: 100,
            originalQuantity: 100,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(buyOrder);

        // 40 shares were filled at ₹95
        expect(buyOrder.quantity).toBe(60);

        // ₹10,000 was initially locked.
        // ₹4,000 was consumed for the 40 shares at the buyer's limit price.
        // ₹200 was released because the trade happened at ₹95 instead of ₹100.
        expect(buyer.lockedBalance).toBe(6_000);
        expect(buyer.balance).toBe(200);

        expect(buyer.holdings.get("AAPL")).toBe(40);

        // Cancel the remaining 60 shares
        const cancelledOrder = exchange.cancelOrder(buyOrder.id);

        expect(cancelledOrder.status).toBe("CANCELLED");
        expect(cancelledOrder.quantity).toBe(60);

        // Remaining ₹6,000 is released
        expect(buyer.lockedBalance).toBe(0);
        expect(buyer.balance).toBe(6_200);

        // Holdings from the executed portion remain
        expect(buyer.holdings.get("AAPL")).toBe(40);
    });

    it('cancels a partially filled SELL order and releases only remaining locked holdings', () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const seller = exchange.createAccount("seller");
        const buyer = exchange.createAccount("buyer");

        seller.holdings.set("AAPL", 100);
        buyer.balance = 10_000;

        const sellOrder = {
            id: "sell-1",
            userId: "seller",
            stockId: "AAPL",
            side: "SELL" as const,
            price: 95,
            quantity: 100,
            originalQuantity: 100,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(sellOrder);

        // 100 shares are now locked
        expect(seller.holdings.get("AAPL")).toBe(0);
        expect(seller.lockedHoldings.get("AAPL")).toBe(100);

        const buyOrder = {
            id: "buy-1",
            userId: "buyer",
            stockId: "AAPL",
            side: "BUY" as const,
            price: 100,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(buyOrder);

        // 40 shares were sold
        expect(sellOrder.quantity).toBe(60);

        expect(seller.holdings.get("AAPL")).toBe(0);
        expect(seller.lockedHoldings.get("AAPL")).toBe(60);

        // Seller received 40 × ₹95
        expect(seller.balance).toBe(3_800);

        // Cancel the remaining 60 shares
        const cancelledOrder = exchange.cancelOrder(sellOrder.id);

        expect(cancelledOrder.status).toBe("CANCELLED");
        expect(cancelledOrder.quantity).toBe(60);

        // Only the remaining 60 shares are returned
        expect(seller.holdings.get("AAPL")).toBe(60);
        expect(seller.lockedHoldings.get("AAPL")).toBe(0);

        // The ₹3,800 from the executed trade remains
        expect(seller.balance).toBe(3_800);
    });

    it('does not cancel a filled order', () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const buyer = exchange.createAccount("buyer");
        const seller = exchange.createAccount("seller");

        buyer.balance = 10_000;
        seller.holdings.set("AAPL", 40);

        const sellOrder = {
            id: "sell-1",
            userId: "seller",
            stockId: "AAPL",
            side: "SELL" as const,
            price: 95,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(sellOrder);

        const buyOrder = {
            id: "buy-1",
            userId: "buyer",
            stockId: "AAPL",
            side: "BUY" as const,
            price: 100,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(buyOrder);

        expect(buyOrder.status).toBe("FILLED");
        expect(buyOrder.quantity).toBe(0);

        expect(() => {
            exchange.cancelOrder(buyOrder.id);
        }).toThrow("Order not found");

        // Make sure no resources magically come back
        expect(buyer.balance).toBe(6_200);
        expect(buyer.lockedBalance).toBe(0);
        expect(buyer.holdings.get("AAPL")).toBe(40);
    });

    it('does not cancel an already cancelled order', () => {
        const exchange = new Exchange();

        exchange.addStock("AAPL");

        const buyer = exchange.createAccount("buyer");

        buyer.balance = 10_000;

        const buyOrder = {
            id: "buy-1",
            userId: "buyer",
            stockId: "AAPL",
            side: "BUY" as const,
            price: 100,
            quantity: 40,
            originalQuantity: 40,
            timestamp: Date.now(),
            status: "OPEN" as const
        };

        exchange.placeOrder(buyOrder);

        // First cancellation
        const cancelledOrder = exchange.cancelOrder(buyOrder.id);

        expect(cancelledOrder.status).toBe("CANCELLED");
        expect(buyer.balance).toBe(10_000);
        expect(buyer.lockedBalance).toBe(0);

        // Second cancellation should fail
        expect(() => {
            exchange.cancelOrder(buyOrder.id);
        }).toThrow("Order not found");

        // Balance must remain unchanged
        expect(buyer.balance).toBe(10_000);
        expect(buyer.lockedBalance).toBe(0);
    });
});