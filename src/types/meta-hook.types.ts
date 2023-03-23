export type onReadTableMeta = (tableName: string) => Promise<object | null>;

export type onWriteTableMeta = (
  tableName: string,
  metaData: object,
) => Promise<boolean>;

export type onReadColumnMeta = (
  tableName: string,
  columnName: string,
) => Promise<object | null>;

export type onWriteColumnMeta = (
  tableName: string,
  columnName: string,
  metaData: object,
) => Promise<boolean>;

export interface IMetaHooks {
  onReadTableMeta: onReadTableMeta;
  onWriteTableMeta: onWriteTableMeta;
  onReadColumnMeta: onReadColumnMeta;
  onWriteColumnMeta: onWriteColumnMeta;
}
