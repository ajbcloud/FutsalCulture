export const toCents = (n: number) => Math.round(n * 100);
export const fromCents = (c: number) => (c ?? 0) / 100;
export const sumCents = (arr: number[]) => arr.reduce((a,b)=>a+(b||0),0);