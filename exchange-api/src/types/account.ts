export type Account = {
    userId: string,

    balance: number,
    lockedBalance: number,

    holdings: Map<string, number>,
    lockedHoldings: Map<string, number>
};