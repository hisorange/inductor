export interface IUnique<UniqueMeta = unknown> {
  meta?: UniqueMeta;

  columns: string[];
}
