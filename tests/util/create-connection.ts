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
    access: 'write',
  };

  return new Connection(config);
};
