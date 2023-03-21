import { Knex } from 'knex';

type isLogged = boolean;
type TableList = [string, isLogged][];

export const readTableList = async (knex: Knex): Promise<TableList> =>
  (
    await knex({
      rel: 'pg_class',
    })
      .select({
        name: 'rel.relname',
        persistence: 'rel.relpersistence',
      })
      .where({
        'rel.relkind': 'r',
        'rel.relnamespace': knex.raw('current_schema::regnamespace'),
      })
  ).map(r => [r.name, r.persistence !== 'u']);
