import { Model, ModelClass } from 'objection';
import { ISchema } from './schema.interface';

export type SchemaMap = Map<
  string,
  { schema: ISchema; model: ModelClass<Model> }
>;
