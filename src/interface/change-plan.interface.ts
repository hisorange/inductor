import { Knex } from 'knex';

export interface IChangePlan {
  steps: Knex.SchemaBuilder[];
}
