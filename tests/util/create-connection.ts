import { Inductor } from '../../src/inductor';
import { IConfig } from '../../src/types/config.interface';

export const createTestDriver = (filters: string[] = []): Inductor => {
  const config: IConfig = {
    connection: {
      connectionString: 'postgres://inductor:inductor@localhost:9999/inductor',
    },
    isReadOnly: false,
    tables: [],
    filters: filters,
  };

  return new Inductor(config);
};
