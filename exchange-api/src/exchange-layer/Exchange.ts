import { MatchingEngine } from "../matching-engine/MatchingEngine.js";
import { AccountManager } from "../settlement-layer/AccountManager.js";
import { Settlement } from "../settlement-layer/Settlement.js";
import type { Order } from "../types/order.js";

export class Exchange {
    private accountManager: AccountManager;
    private settlement: Settlement;

    private orders: Map<string, Order>;
    private markets: Map<string, MatchingEngine>;

    constructor() {
        this.accountManager = new AccountManager();
        this.orders = new Map<string, Order>();
        this.settlement = new Settlement(this.accountManager);
        this.markets = new Map<string, MatchingEngine>();
    }

    createAccount(userId: string) {
        return this.accountManager.createAccount(userId);
    }

    addStock(stockId: string) {
        if (this.markets.has(stockId)) {
            throw new Error("Stock already exists");
        }

        const matchingEngine = new MatchingEngine();

        this.markets.set(stockId, matchingEngine);
    }

    placeOrder(order: Order){
        const matchingEngine = this.markets.get(order.stockId);

        if (!matchingEngine) {
            throw new Error("Stock not found");
        }

        const account = this.accountManager.getAccount(order.userId);

        if (!account) {
            throw new Error("Account not found");
        }

        if (order.side === "BUY") {
            const requiredBalance = order.price * order.originalQuantity;

            if (account.balance < requiredBalance) {
                throw new Error("Insufficient balance");
            }

            account.balance -= requiredBalance;
            account.lockedBalance += requiredBalance;
        }

        if (order.side === "SELL") {
            const holdings = account.holdings.get(order.stockId) ?? 0;

            if (holdings < order.originalQuantity) {
                throw new Error("Insufficient holdings");
            }

            account.holdings.set(
                order.stockId,
                holdings - order.originalQuantity
            );

            const lockedHoldings = account.lockedHoldings.get(order.stockId) ?? 0;

            account.lockedHoldings.set(
                order.stockId,
                lockedHoldings + order.originalQuantity
            );
        }

        this.orders.set(order.id, order);

        const { trades } = matchingEngine.matchOrder(order);

        if(!trades) throw new Error("Order matching failed");

        for (const trade of trades) {
            this.settlement.settleTrade(trade, this.orders);
        }

        return {
            order,
            trades
        };

    }
}