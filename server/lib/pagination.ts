export function pageParams(q: any) {
  const page = Math.max(1, Number(q.page ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize ?? 25)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
export function wrapRows<T>(rows: T[], page: number, pageSize: number, totalRows: number) {
  return { rows, page, pageSize, totalRows };
}