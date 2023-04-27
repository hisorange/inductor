import { Inductor } from '../../src/inductor';
import { IConfig } from '../../src/types/config.interface';

export const createTestDriver = (filters: string[] = []): Inductor => {
  const config: IConfig = {
    connection: {
      connectionString: 'postgres://inductor:inductor@localhost:9999/inductor',
    },
    isReadOnly: false,
    filters: filters,
  };

  return new Inductor(config, {
    meta: {
      id: 'ddec3364-0476-496e-84af-0a14b9122e4b',
    },
    tables: [],
  });
};
