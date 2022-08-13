import { Inductor } from '../../src/inductor';
import { IDatabase } from '../../src/interface/database.interface';

export const createTestInstance = (filters: string[] = []) => {
  const database: IDatabase = {
    connection: {
      host: 'localhost',
      port: 9999,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
    provider: 'postgres',
    isReadOnly: false,
    blueprints: {},
    filters: filters,
  };

  return new Inductor(database);
};
