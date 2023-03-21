import { Knex } from 'knex';

export const readUniqueConstraints = async (knex: Knex): Promise<string[]> => {
  return (
    await knex({
      tc: 'information_schema.table_constraints',
    })
      .select({
        uniqueName: 'tc.constraint_name',
      })
      .where({
        'tc.constraint_type': 'UNIQUE',
        'tc.table_schema': knex.raw('current_schema()'),
      })
  ).map(r => r.uniqueName);
};
