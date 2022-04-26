import { Connection } from '../../src/connection';

export const createConnection = () => {
  const config: Connection['config'] = {
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
  };

  return new Connection(config);
};
