import { createDriver } from '../../../src/driver.factory';
import { IDriver } from '../../../src/interface';
import { IDatabase } from '../../../src/interface/database/database.interface';
import { DatabaseProvider } from '../../../src/interface/database/database.provider';

export const createMySQLDriver = (
  filters: string[] = [],
): IDriver<DatabaseProvider.MYSQL> => {
  const database: IDatabase<DatabaseProvider.MYSQL> = {
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

  return createDriver(database) as IDriver<DatabaseProvider.MYSQL>;
};
