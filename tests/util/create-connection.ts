import { Inductor } from '../../src/inductor';
import { IDatabase } from '../../src/types/database.interface';

export const createTestDriver = (filters: string[] = []): Inductor => {
  const database: IDatabase = {
    connection: {
      host: 'localhost',
      port: 9999,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
    isReadOnly: false,
    tables: [],
    filters: filters,
  };

  return new Inductor(database);
};
