import type { OrderBookSide, Order, OrderResult } from "../types/order.js";
import type { Trade } from "../types/trade.js";

export class MatchingEngine {
    bids: OrderBookSide = new Map();
    asks: OrderBookSide = new Map();

    insertOrder(order: Order) {
        if(order.side == "BUY") {
            if(!this.bids.get(order.price)){
                this.bids.set(order.price, [order]);

                return this.bids.get(order.price)![0];
            }

            this.bids.get(order.price)?.push(order);

            return this.asks.get(order.price)![0];
        }

        if(order.side == "SELL") {
            if(!this.asks.get(order.price)){
                this.asks.set(order.price, [order]);

                return this.asks.get(order.price)![0];
            }

            this.asks.get(order.price)?.push(order)

            return this.asks.get(order.price)![0];
        }
    }

    matchOrder(order: Order): OrderResult{
        const incomingOrder = this.insertOrder(order);
        let trades: Trade[] = [];

        while(incomingOrder!.quantity > 0){
            if(order.side == "BUY") {
                const bestAsk = Math.min(...this.asks.keys());
                if(order.price < bestAsk) {
                    return {
                        order: incomingOrder!,
                        trades
                    }
                }

                const oldestOrder = this.asks.get(bestAsk)![0];
                const tradingQuantity = Math.min(incomingOrder!.quantity, oldestOrder!.quantity);

                oldestOrder!.quantity = oldestOrder!.quantity - tradingQuantity;
                incomingOrder!.quantity = incomingOrder!.quantity - tradingQuantity;

                trades.push({
                    buyOrderId: incomingOrder!.id,
                    sellOrderId: oldestOrder!.id,
                    stockId: order.stockId,
                    price: oldestOrder!.price,
                    quantity: tradingQuantity
                })

                incomingOrder!.status = "PARTIALLY FILLED";
                oldestOrder!.status = "PARTIALLY FILLED";

                if(incomingOrder!.quantity == 0){ 
                    this.bids.get(order.price)!.shift(); 
                    incomingOrder!.status = "FILLED";
                };
                if(this.bids.get(order.price)!.length == 0) this.bids.delete(order.price);

                if(oldestOrder!.quantity == 0){
                    this.asks.get(bestAsk)!.shift();
                    oldestOrder!.status = "FILLED";
                };
                if(this.asks.get(bestAsk)!.length == 0) this.asks.delete(bestAsk);
            }

            if(order.side == "SELL") {
                const bestBid = Math.max(...this.bids.keys());
                if(order.price > bestBid) {
                    return {
                        order: incomingOrder!,
                        trades
                    }
                }

                const oldestOrder = this.bids.get(bestBid)![0];
                const tradingQuantity = Math.min(incomingOrder!.quantity, oldestOrder!.quantity);

                oldestOrder!.quantity = oldestOrder!.quantity - tradingQuantity;
                incomingOrder!.quantity = incomingOrder!.quantity - tradingQuantity;

                trades.push({
                    buyOrderId: oldestOrder!.id,
                    sellOrderId: incomingOrder!.id,
                    stockId: order.stockId,
                    price: oldestOrder!.price,
                    quantity: tradingQuantity
                })

                incomingOrder!.status = "PARTIALLY FILLED";
                oldestOrder!.status = "PARTIALLY FILLED";

                if(incomingOrder!.quantity == 0){
                    this.asks.get(order.price)!.shift();
                    incomingOrder!.status = "FILLED";
                }
                if(this.asks.get(order.price)!.length == 0) this.asks.delete(order.price);

                if(oldestOrder!.quantity == 0){ 
                    this.bids.get(bestBid)!.shift();
                    oldestOrder!.status = "FILLED";
                }
                if(this.bids.get(bestBid)!.length == 0) this.bids.delete(bestBid);
            }
        }

        return {
            order: incomingOrder!,
            trades
        }
    }

    getOrderBook() {
        return {bids: this.bids, asks: this.asks};
    }

    deleteOrder(orderId: string): Order {
        for (const [key, orders] of this.asks) {
            const index = orders.findIndex(order => order.id === orderId);

            if (index !== -1) {
                const [order] = orders.splice(index, 1);
                if(!order) throw new Error("Order not found");

                if (orders.length === 0) {
                    this.asks.delete(key);
                }

                order.status = "CANCELLED";

                return order;
            }
        }

        for (const [key, orders] of this.bids) {
            const index = orders.findIndex(order => order.id === orderId);

            if (index !== -1) {
                const [order] = orders.splice(index, 1);
                if(!order) throw new Error("Order not found");

                if (orders.length === 0) {
                    this.bids.delete(key);
                }

                order.status = "CANCELLED";

                return order;
            }
        }

        throw new Error("Order not found");
    }
}