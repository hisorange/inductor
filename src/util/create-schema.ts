import { ISchema } from '../interface/schema/schema.interface';
import { SchemaKind } from '../interface/schema/schema.kind';

export const createSchema = (
  tableName: string,
  type: SchemaKind = SchemaKind.TABLE,
): ISchema => ({
  tableName,
  kind: type,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
});
