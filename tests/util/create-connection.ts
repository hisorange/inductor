import { Driver } from '../../src/driver/driver';
import { IDatabase } from '../../src/driver/types/database.interface';
import { IDriver } from '../../src/driver/types/driver.interface';

export const createTestDriver = (filters: string[] = []): IDriver => {
  const database: IDatabase = {
    connection: {
      host: 'localhost',
      port: 9999,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
    isReadOnly: false,
    blueprints: [],
    filters: filters,
  };

  return new Driver(database);
};
