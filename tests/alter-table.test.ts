import { Connection } from '../src/connection';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createConnection } from './util/create-connection';

describe('Alter table', () => {
  let conn: Connection;

  beforeAll(() => {
    conn = createConnection();
  });

  afterAll(async () => {
    await conn.close();
  });

  test.each(Object.keys(allColumn))(
    'should be able to reverse the column [%s]',
    async cName => {
      // Remove the changes
      await conn.knex.schema.dropTableIfExists('alter_test');

      // Create the table
      const schema: ISchema = {
        name: 'alter_test',
        kind: 'table',
        columns: {
          [cName]: allColumn[cName],
        },
      };
      await conn.associate(schema);

      expect(await conn.migrator.inspector.hasTable('alter_test')).toBeTruthy();

      // Reapply the state
      await conn.associate(schema);

      // Verify the changes
      const newColumns = await conn.migrator.inspector.columnInfo('alter_test');
      expect(newColumns.map(c => c.name)).toContain(cName);
    },
    15_000,
  );
});
