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
            timestamp: Date.now()
        });

        const aliceOrder = engine.matchOrder({
            id: "2",
            userId: "alice",
            side: "BUY",
            price: 100,
            quantity: 20,
            timestamp: Date.now()
        });

        const {bids, asks} = engine.getOrderBook();

        expect(bobOrder.remainingQuantity).toBe(20);
        expect(aliceOrder.remainingQuantity).toBe(0);

        expect(aliceOrder.trades).toEqual([
                { 
                    buyOrderId: 'alice', 
                    sellOrderId: 'bob', 
                    price: 100, 
                    quantity: 20 
                }
            ]);

        expect(bids).toEqual(new Map());
        expect(asks).toEqual(new Map());
    })

    it('keeps unmatched orders in the orderbook', () => {
        const engine = new MatchingEngine();

        const bobOrder = engine.matchOrder({
            id: "1",
            userId: "bob",
            side: "SELL",
            price: 110,
            quantity: 20,
            timestamp: Date.now()
        });

        const aliceOrder = engine.matchOrder({
            id: "2",
            userId: "alice",
            side: "BUY",
            price: 100,
            quantity: 20,
            timestamp: Date.now()
        });

        const {bids, asks} = engine.getOrderBook();

        expect(bobOrder.remainingQuantity).toBe(20);
        expect(aliceOrder.remainingQuantity).toBe(20);

        expect(aliceOrder.trades).toEqual([]);

        expect(asks).toEqual(new Map([[110, [bobOrder.order]] ]));
        
        expect(bids).toEqual(new Map([[100, [aliceOrder.order] ]]));
    })
})