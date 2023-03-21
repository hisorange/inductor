import { Knex } from 'knex';

export const readTypes = async (knex: Knex): Promise<string[]> =>
  (
    await knex({
      t: 'pg_type',
    })
      .select({
        type: 't.typname',
      })
      .join(
        {
          ns: 'pg_namespace',
        },
        {
          'ns.oid': 't.typnamespace',
        },
      )
      .where({
        'ns.nspname': knex.raw('current_schema()'),
        't.typisdefined': true,
      })
      .whereNot({
        't.typarray': 0,
      })
  ).map(r => r.type);
