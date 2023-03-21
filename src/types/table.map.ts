import { Model, ModelClass } from 'objection';
import { ITable } from './table.interface';

export type TableMap = Map<string, { table: ITable; model: ModelClass<Model> }>;
