import { Knex } from 'knex';

export const readRowCount = async (
  knex: Knex,
  name: string,
): Promise<boolean> =>
  (await knex.select().from(name).limit(1).count('* as count'))[0].count > 0;
