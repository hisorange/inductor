import { ISchema } from './types';
import { SchemaKind } from './types/schema.kind';

export const InitiateSchema = (
  tableName: string,
  kind: SchemaKind = SchemaKind.TABLE,
): ISchema => ({
  tableName,
  kind,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
  isLogged: true,
});
