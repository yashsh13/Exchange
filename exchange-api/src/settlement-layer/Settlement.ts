import type { Order } from "../types/order.js";
import type { Trade } from "../types/trade.js";
import { AccountManager } from "./AccountManager.js";

export class Settlement {

    constructor(
        private accountManager: AccountManager,
        private stockId: string
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
            this.stockId,
            (buyer.holdings.get(this.stockId) ?? 0) + trade.quantity
        );

        seller.lockedHoldings.set(
            this.stockId,
            (seller.lockedHoldings.get(this.stockId) ?? 0) - trade.quantity
        );

        seller.balance += value;

        this.accountManager.releaseOrderResources(buyOrder, trade, this.stockId);
    }

}