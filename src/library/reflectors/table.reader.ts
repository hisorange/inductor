import { Knex } from 'knex';

type isLogged = boolean;
type TableList = [string, isLogged, string][];

export const readTableList = async (knex: Knex): Promise<TableList> =>
  (
    await knex({
      rel: 'pg_class',
    })
      .select({
        name: 'rel.relname',
        persistence: 'rel.relpersistence',
        comment: 'desc.description',
      })
      .innerJoin(
        {
          desc: 'pg_description',
        },
        {
          'desc.objoid': 'rel.oid',
        },
      )
      .where({
        'rel.relkind': 'r',
        'rel.relnamespace': knex.raw('current_schema::regnamespace'),
      })
  ).map(r => [r.name, r.persistence !== 'u', r.comment]);
