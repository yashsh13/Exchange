import { expect, it, describe } from "vitest";
import { AccountManager } from "../../src/settlement-layer/AccountManager.js";
import { Settlement } from "../../src/settlement-layer/Settlement.js";
import type { Order } from "../../src/types/order.js";
import type { Trade } from "../../src/types/trade.js";

describe("Settlement - settleTrade", () => {
    it("should settle a trade and release the buyer's unused locked balance", () => {
        const accountManager = new AccountManager();

        const buyer = accountManager.createAccount("buyer1");
        const seller = accountManager.createAccount("seller1");

        buyer.balance = 0;
        buyer.lockedBalance = 10_000;

        seller.balance = 0;
        seller.holdings.set("AAPL", 100);
        seller.lockedHoldings.set("AAPL", 40);

        const buyOrder: Order = {
            id: "buy-order-1",
            userId: "buyer1",
            side: "BUY",
            price: 100,
            originalQuantity: 100,
            quantity: 60,
            timestamp: Date.now(),
            status: "PARTIALLY FILLED",
        };

        const sellOrder: Order = {
            id: "sell-order-1",
            userId: "seller1",
            side: "SELL",
            price: 95,
            originalQuantity: 40,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const trade: Trade = {
            buyOrderId: "buy-order-1",
            sellOrderId: "sell-order-1",
            price: 95,
            quantity: 40
        };

        const orders = new Map<string, Order>();

        orders.set(buyOrder.id, buyOrder);
        orders.set(sellOrder.id, sellOrder);

        const settlement = new Settlement(
            accountManager,
            "AAPL"
        );

        settlement.settleTrade(trade, orders);

        // Buyer
        expect(buyer.lockedBalance).toBe(6_000);
        expect(buyer.balance).toBe(200);
        expect(buyer.holdings.get("AAPL")).toBe(40);

        // Seller
        expect(seller.lockedHoldings.get("AAPL")).toBe(0);
        expect(seller.balance).toBe(3_800);
    });

    it("should not release any balance when trade price equals buyer order price", () => {
        const accountManager = new AccountManager();

        const buyer = accountManager.createAccount("buyer1");
        const seller = accountManager.createAccount("seller1");

        buyer.balance = 0;
        buyer.lockedBalance = 5_000;

        seller.balance = 0;
        seller.holdings.set("AAPL", 100);
        seller.lockedHoldings.set("AAPL", 50);

        const buyOrder: Order = {
            id: "buy-order-1",
            userId: "buyer1",
            side: "BUY",
            price: 100,
            originalQuantity: 50,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const sellOrder: Order = {
            id: "sell-order-1",
            userId: "seller1",
            side: "SELL",
            price: 100,
            originalQuantity: 50,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const trade: Trade = {
            buyOrderId: "buy-order-1",
            sellOrderId: "sell-order-1",
            price: 100,
            quantity: 50
        };

        const orders = new Map<string, Order>();

        orders.set(buyOrder.id, buyOrder);
        orders.set(sellOrder.id, sellOrder);

        const settlement = new Settlement(
            accountManager,
            "AAPL"
        );

        settlement.settleTrade(trade, orders);

        // Buyer
        expect(buyer.lockedBalance).toBe(0);
        expect(buyer.balance).toBe(0);
        expect(buyer.holdings.get("AAPL")).toBe(50);

        // Seller
        expect(seller.lockedHoldings.get("AAPL")).toBe(0);
        expect(seller.balance).toBe(5_000);
    });

    it("should settle the seller side correctly when some locked holdings remain", () => {
        const accountManager = new AccountManager();

        const buyer = accountManager.createAccount("buyer1");
        const seller = accountManager.createAccount("seller1");

        buyer.balance = 0;
        buyer.lockedBalance = 4_000;

        seller.balance = 0;
        seller.holdings.set("AAPL", 100);
        seller.lockedHoldings.set("AAPL", 60);

        const buyOrder: Order = {
            id: "buy-order-1",
            userId: "buyer1",
            side: "BUY",
            price: 100,
            originalQuantity: 40,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const sellOrder: Order = {
            id: "sell-order-1",
            userId: "seller1",
            side: "SELL",
            price: 95,
            originalQuantity: 60,
            quantity: 20,
            timestamp: Date.now(),
            status: "PARTIALLY FILLED",
        };

        const trade: Trade = {
            buyOrderId: "buy-order-1",
            sellOrderId: "sell-order-1",
            price: 95,
            quantity: 40
        };

        const orders = new Map<string, Order>();

        orders.set(buyOrder.id, buyOrder);
        orders.set(sellOrder.id, sellOrder);

        const settlement = new Settlement(
            accountManager,
            "AAPL"
        );

        settlement.settleTrade(trade, orders);

        // Buyer
        expect(buyer.lockedBalance).toBe(0);
        expect(buyer.balance).toBe(200);
        expect(buyer.holdings.get("AAPL")).toBe(40);

        // Seller
        expect(seller.lockedHoldings.get("AAPL")).toBe(20);
        expect(seller.balance).toBe(3_800);
    });

    it("should correctly settle multiple trades for the same buy order", () => {
        const accountManager = new AccountManager();

        const buyer = accountManager.createAccount("buyer1");
        const seller1 = accountManager.createAccount("seller1");
        const seller2 = accountManager.createAccount("seller2");

        buyer.balance = 0;
        buyer.lockedBalance = 10_000;

        seller1.balance = 0;
        seller1.holdings.set("AAPL", 40);
        seller1.lockedHoldings.set("AAPL", 40);

        seller2.balance = 0;
        seller2.holdings.set("AAPL", 60);
        seller2.lockedHoldings.set("AAPL", 60);

        const buyOrder: Order = {
            id: "buy-order-1",
            userId: "buyer1",
            side: "BUY",
            price: 100,
            originalQuantity: 100,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const sellOrder1: Order = {
            id: "sell-order-1",
            userId: "seller1",
            side: "SELL",
            price: 95,
            originalQuantity: 40,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const sellOrder2: Order = {
            id: "sell-order-2",
            userId: "seller2",
            side: "SELL",
            price: 98,
            originalQuantity: 60,
            quantity: 0,
            timestamp: Date.now(),
            status: "FILLED",
        };

        const trade1: Trade = {
            buyOrderId: "buy-order-1",
            sellOrderId: "sell-order-1",
            price: 95,
            quantity: 40
        };

        const trade2: Trade = {
            buyOrderId: "buy-order-1",
            sellOrderId: "sell-order-2",
            price: 98,
            quantity: 60
        };

        const orders = new Map<string, Order>();

        orders.set(buyOrder.id, buyOrder);
        orders.set(sellOrder1.id, sellOrder1);
        orders.set(sellOrder2.id, sellOrder2);

        const settlement = new Settlement(
            accountManager,
            "AAPL"
        );

        settlement.settleTrade(trade1, orders);
        settlement.settleTrade(trade2, orders);

        // Buyer
        expect(buyer.lockedBalance).toBe(0);
        expect(buyer.balance).toBe(320);
        expect(buyer.holdings.get("AAPL")).toBe(100);

        // Seller 1
        expect(seller1.lockedHoldings.get("AAPL")).toBe(0);
        expect(seller1.balance).toBe(3_800);

        // Seller 2
        expect(seller2.lockedHoldings.get("AAPL")).toBe(0);
        expect(seller2.balance).toBe(5_880);
    });
});