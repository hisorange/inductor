import { Connection } from '../src/connection';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createConnection } from './util/create-connection';

describe('Table creation', () => {
  let conn: Connection;

  beforeAll(() => {
    conn = createConnection();
  });

  afterAll(async () => {
    await conn.close();
  });

  test.each(['test', '__test', 'TeSt_ted'])(
    'should create the [%s] table from the schema',
    async (id: string) => {
      const schema: ISchema = {
        name: id,
        kind: 'table',
        columns: allColumn,
      };

      await conn.associate(schema);

      expect(await conn.migrator.inspector.tables()).toContain(id);
    },
    5_000,
  );
});
