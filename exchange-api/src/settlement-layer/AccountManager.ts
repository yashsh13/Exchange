import type { Account } from "../types/account.js";
import type { Order } from "../types/order.js";
import type { Trade } from "../types/trade.js";

export class AccountManager {
    private accounts = new Map<string, Account>();


    createAccount(userId: string): Account {
        const acc: Account = {
            userId,
            balance: 0,
            lockedBalance: 0,
            holdings: new Map([]),
            lockedHoldings: new Map([])
        }

        this.accounts.set(userId, acc);
        return acc;
    }

    getAccount(userId: string) {
        const acc = this.accounts.get(userId);
        return acc;
    }

    releaseOrderResources(
        order: Order,
        trade: Trade,
        stockId: string
    ) {
        const account = this.getAccount(order.userId);

        if (!account) {
            throw new Error("Account not found");
        }

        if (order.side === "BUY") {
            const expectedTradeValue = order.price * trade.quantity;
            const actualTradeValue = trade.price * trade.quantity;

            const releaseAmount = expectedTradeValue - actualTradeValue;

            account.lockedBalance -= releaseAmount;
            account.balance += releaseAmount;
        }

        if (order.side === "SELL") {
            const lockedShares =
                account.lockedHoldings.get(stockId) ?? 0;

            account.lockedHoldings.set(
                stockId,
                lockedShares - order.quantity
            );

            const holdings =
                account.holdings.get(stockId) ?? 0;

            account.holdings.set(
                stockId,
                holdings + order.quantity
            );
        }
    }
}