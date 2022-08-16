import { createDriver } from '../../../src/driver.factory';
import { IDriver } from '../../../src/interface';
import { IDatabase } from '../../../src/interface/database/database.interface';
import { DatabaseProvider } from '../../../src/interface/database/database.provider';

export const createPostgresDriver = (
  filters: string[] = [],
): IDriver<DatabaseProvider.POSTGRES> => {
  const database: IDatabase<DatabaseProvider.POSTGRES> = {
    connection: {
      host: 'localhost',
      port: 9999,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
    provider: DatabaseProvider.POSTGRES,
    isReadOnly: false,
    blueprints: {},
    filters: filters,
  };

  return createDriver(database) as IDriver<DatabaseProvider.POSTGRES>;
};
