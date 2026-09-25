import type { Order } from "../types/order.js";
import type { Trade } from "../types/trade.js";
import { AccountManager } from "./AccountManager.js";

export class Settlement {

    constructor(
        private accountManager: AccountManager
    ) {}

    settleTrade(trade: Trade, orders: Map<string, Order>) {

        const buyOrder = orders.get(trade.buyOrderId);
        const sellOrder = orders.get(trade.sellOrderId);

        if (!buyOrder || !sellOrder) {
            throw new Error("Order not found");
        }

        const buyer = this.accountManager.getAccount(buyOrder.userId);
        const seller = this.accountManager.getAccount(sellOrder.userId);

        if (!buyer || !seller) throw new Error("Account not found");

        const value = trade.price * trade.quantity;

        buyer.lockedBalance -= value;

        buyer.holdings.set(
            trade.stockId,
            (buyer.holdings.get(trade.stockId) ?? 0) + trade.quantity
        );

        seller.lockedHoldings.set(
            trade.stockId,
            (seller.lockedHoldings.get(trade.stockId) ?? 0) - trade.quantity
        );

        seller.balance += value;

        //Release Locked resources
        const expectedTradeValue = buyOrder.price * trade.quantity;
        const actualTradeValue = trade.price * trade.quantity;
        const releaseAmount = expectedTradeValue - actualTradeValue;

        buyer.lockedBalance -= releaseAmount;
        buyer.balance += releaseAmount;
    }

}