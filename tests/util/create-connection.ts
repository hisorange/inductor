import { Inductor } from '../../src/inductor';

export const createTestInstance = () => {
  const config: Inductor['config'] = {
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
  };

  return new Inductor(config);
};
