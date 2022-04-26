import { Connection } from '../src/connection';
import { ColumnType } from '../src/enum/column-type.enum';
import { ISchema } from '../src/interface/schema.interface';
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
        columns: {
          id: {
            kind: 'column',
            type: ColumnType.TEXT,
            name: 'id',
          },
        },
      };

      await conn.associate(schema);

      expect(await conn.migrator.inspector.tables()).toContain(id);
    },
    5_000,
  );
});
