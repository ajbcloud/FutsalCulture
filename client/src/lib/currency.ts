export function formatCurrency(cents: number, currency = 'USD'): string {
  const amount = (cents ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}