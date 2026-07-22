// Tiered, capped Wakala (agency) fee — a fixed price for service, never a %.
export function computeWakalaFee(amount: number): number {
  if (amount <= 5_000) return 25;
  if (amount <= 25_000) return 75;
  if (amount <= 100_000) return 200;
  return 400; // capped
}

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}
