import type { LedgerEntry, Order } from "./types";

// Post a balanced DR/CR pair onto an order's ledger. Wallet-style accounts are
// liability accounts from the platform's perspective: CR = money in, DR = money out.
export function postPair(
  order: Order,
  clock: number,
  fromAccount: string,
  toAccount: string,
  amount: number,
  memo: string
): void {
  const txnId = `TXN-${order.id}-${order.ledgerEntries.length / 2 + 1}`;
  order.ledgerEntries.push(
    { txnId, account: fromAccount, direction: "DR", amount, timestamp: clock, memo },
    { txnId, account: toAccount, direction: "CR", amount, timestamp: clock, memo }
  );
}

export function balanceOf(orders: Order[], account: string, opening = 0): number {
  let bal = opening;
  for (const o of orders) {
    for (const e of o.ledgerEntries) {
      if (e.account !== account) continue;
      bal += e.direction === "CR" ? e.amount : -e.amount;
    }
  }
  return bal;
}

export function allEntries(orders: Order[]): (LedgerEntry & { orderId: string })[] {
  return orders
    .flatMap((o) => o.ledgerEntries.map((e) => ({ ...e, orderId: o.id })))
    .sort((a, b) => a.timestamp - b.timestamp);
}
