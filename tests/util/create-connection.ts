import { Inductor } from '../../src/inductor';
import { IDatabase } from '../../src/types/database.interface';

export const createTestDriver = (filters: string[] = []): Inductor => {
  const database: IDatabase = {
    connection: {
      connectionString: 'postgres://inductor:inductor@localhost:9999/inductor',
    },
    isReadOnly: false,
    tables: [],
    filters: filters,
  };

  return new Inductor(database);
};
