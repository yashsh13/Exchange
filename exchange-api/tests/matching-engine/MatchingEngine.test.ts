import { describe, it, expect } from "vitest";
import { MatchingEngine } from "../../src/matching-engine/MatchingEngine.js";

describe('Matching engine tests', () => {

    it('Matches equal order', () => {
        const engine = new MatchingEngine();

        const bobOrder = engine.matchOrder({
            id: "1",
            userId: "bob",
            side: "SELL",
            price: 100,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const aliceOrder = engine.matchOrder({
            id: "2",
            userId: "alice",
            side: "BUY",
            price: 100,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const {bids, asks} = engine.getOrderBook();

        expect(bobOrder.order.quantity).toBe(0);
        expect(aliceOrder.order.quantity).toBe(0);

        expect(aliceOrder.trades).toEqual([
                { 
                    buyOrderId: 'alice', 
                    sellOrderId: 'bob', 
                    price: 100, 
                    quantity: 20 
                }
        ]);

        expect(bobOrder.order.status).toBe("FILLED");
        expect(aliceOrder.order.status).toBe("FILLED");

        expect(bids).toEqual(new Map());
        expect(asks).toEqual(new Map());
    });

    it('keeps unmatched orders in the orderbook', () => {
        const engine = new MatchingEngine();

        const bobOrder = engine.matchOrder({
            id: "1",
            userId: "bob",
            side: "SELL",
            price: 110,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const aliceOrder = engine.matchOrder({
            id: "2",
            userId: "alice",
            side: "BUY",
            price: 100,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const {bids, asks} = engine.getOrderBook();

        expect(bobOrder.order.quantity).toBe(20);
        expect(aliceOrder.order.quantity).toBe(20);

        expect(bobOrder.order.status).toBe("OPEN");
        expect(aliceOrder.order.status).toBe("OPEN");

        expect(aliceOrder.trades).toEqual([]);

        expect(asks).toEqual(new Map([[110, [bobOrder.order]] ]));
        
        expect(bids).toEqual(new Map([[100, [aliceOrder.order] ]]));
    });

    it('matches partial orders', () => {
        const engine = new MatchingEngine();

        const bobOrder = engine.matchOrder({
            id: "1",
            userId: "bob",
            side: "SELL",
            price: 100,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const aliceOrder = engine.matchOrder({
            id: "2",
            userId: "alice",
            side: "BUY",
            price: 100,
            quantity: 30,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const {bids, asks} = engine.getOrderBook();

        expect(bobOrder.order.quantity).toBe(0);
        expect(aliceOrder.order.quantity).toBe(10);

        expect(bobOrder.order.status).toBe("FILLED");
        expect(aliceOrder.order.status).toBe("PARTIALLY FILLED");

        expect(aliceOrder.trades).toEqual([{ 
                    buyOrderId: 'alice', 
                    sellOrderId: 'bob', 
                    price: 100, 
                    quantity: 20 
                }]);

        expect(asks).toEqual(new Map());
        
        expect(bids).toEqual(new Map([[100, [aliceOrder.order] ]]));
    });

    it('cancels an order', () => {
        const engine = new MatchingEngine();

        const bobOrder = engine.matchOrder({
            id: "1",
            userId: "bob",
            side: "SELL",
            price: 110,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const isCancelled = engine.cancelOrder(bobOrder.order.id);

        const {asks} = engine.getOrderBook();

        expect(bobOrder.order.status).toBe("CANCELLED");
        expect(isCancelled).toBe(true);
        expect(asks).toEqual(new Map());
    });

    it('doesnt cancels an invalid order', () => {
        const engine = new MatchingEngine();

        const bobOrder = engine.matchOrder({
            id: "1",
            userId: "bob",
            side: "SELL",
            price: 110,
            quantity: 20,
            timestamp: Date.now(),
            status: "OPEN"
        });

        const isCancelled = engine.cancelOrder("2");

        const {asks} = engine.getOrderBook();

        expect(isCancelled).toBe(false);
        expect(asks).toEqual(new Map([[110, [bobOrder.order] ]]));
    });
})