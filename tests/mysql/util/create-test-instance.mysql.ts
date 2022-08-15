import { Inductor } from '../../../src/inductor';
import { IDatabase } from '../../../src/interface/database/database.interface';
import { DatabaseProvider } from '../../../src/interface/database/database.provider';

export const createMySQLTestInstance = (filters: string[] = []) => {
  const database: IDatabase = {
    connection: {
      host: 'localhost',
      port: 9998,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
    provider: DatabaseProvider.MYSQL,
    isReadOnly: false,
    blueprints: {},
    filters: filters,
  };

  return new Inductor(database);
};
