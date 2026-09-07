import { type OrderBookSide } from "./OrderBook.js";
import { v4 as uuidv4} from "uuid";

export class MatchingEngine {
    bids: OrderBookSide;
    asks: OrderBookSide;

    constructor() {
        this.bids = new Map();
        this.asks = new Map();
    }

    insertOrder(userId: string, side: "BUY"|"SELL", price: number, quantity: number) {
        if(side == "BUY") {
            if(!this.bids.get(price)){
                this.bids.set(price, [{
                    id: uuidv4(),
                    userId,
                    side,
                    price,
                    quantity,
                    timestamp: Date.now()
                }]);

                return this.bids.get(price)![0];
            }

            this.bids.get(price)?.push({
                id: uuidv4(),
                userId,
                side,
                price,
                quantity,
                timestamp: Date.now()
            });

            return this.asks.get(price)![0];
        }

        if(side == "SELL") {
            if(!this.asks.get(price)){
                this.asks.set(price, [{
                    id: uuidv4(),
                    userId,
                    side,
                    price,
                    quantity,
                    timestamp: Date.now()
                }]);

                return this.asks.get(price)![0];
            }

            this.asks.get(price)?.push({
                id: uuidv4(),
                userId,
                side,
                price,
                quantity,
                timestamp: Date.now()
            })

            return this.asks.get(price)![0];
        }
    }

    matchOrder(userId: string, side: "BUY"|"SELL", price: number, quantity: number) {
        const incomingOrder = this.insertOrder(userId, side, price, quantity);

        while(incomingOrder!.quantity > 0){
            if(side == "BUY") {
                const bestAsk = Math.min(...this.asks.keys());
                if(price < bestAsk) return incomingOrder!.quantity;

                const oldestOrder = this.asks.get(bestAsk)![0];
                const tradingQuantity = Math.min(incomingOrder!.quantity, oldestOrder!.quantity);

                oldestOrder!.quantity = oldestOrder!.quantity - tradingQuantity;
                incomingOrder!.quantity = incomingOrder!.quantity - tradingQuantity;

                if(incomingOrder!.quantity == 0) this.bids.get(price)!.shift();
                if(oldestOrder!.quantity == 0) this.asks.get(bestAsk)!.shift();
                if(this.asks.get(bestAsk)!.length == 0) this.asks.delete(bestAsk);
            }

            if(side == "SELL") {
                const bestBid = Math.max(...this.bids.keys());
                if(price > bestBid) return incomingOrder!.quantity;

                const oldestOrder = this.bids.get(bestBid)![0];
                const tradingQuantity = Math.min(incomingOrder!.quantity, oldestOrder!.quantity);

                oldestOrder!.quantity = oldestOrder!.quantity - tradingQuantity;
                incomingOrder!.quantity = incomingOrder!.quantity - tradingQuantity;

                if(incomingOrder!.quantity == 0) this.asks.get(price)!.shift();
                if(oldestOrder!.quantity == 0) this.bids.get(bestBid)!.shift();
                if(this.bids.get(bestBid)!.length == 0) this.bids.delete(bestBid);
            }
        }
        return incomingOrder!.quantity;
    }

    getOrderBook() {
        return {bids: this.bids, asks: this.asks};
    }
}