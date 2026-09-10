import type { Trade } from "../types/trade.js";
import { AccountManager } from "./AccountManager.js";

export class Settlement {

    private accountManager: AccountManager;

    constructor(accountManager: AccountManager) {
        this.accountManager = accountManager;
    }

    settleTrade(trade: Trade) {
        
    }
}