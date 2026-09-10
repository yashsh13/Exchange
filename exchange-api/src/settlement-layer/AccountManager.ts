import type { Account } from "../types/account.js";

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

}