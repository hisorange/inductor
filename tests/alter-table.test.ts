import cloneDeep from 'lodash.clonedeep';
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
      const tableName = `alter_test_${cName}`;

      // Remove the changes
      await conn.knex.schema.dropTableIfExists(tableName);

      // Create the table
      const schema: ISchema = {
        name: tableName,
        kind: 'table',
        columns: {
          [cName]: allColumn[cName],
        },
      };
      schema.columns[cName].isNullable = false;

      await conn.associate(schema);
      const currentColumn = await conn.migrator.inspector.columnInfo(
        tableName,
        cName,
      );
      expect(currentColumn.is_nullable).toBeFalsy();

      const alteredSchema = cloneDeep(schema);
      // Change the nullable
      alteredSchema.columns[cName].isNullable = true;

      // Reapply the state
      await conn.associate(alteredSchema);

      // Verify the changes
      const newColumns = await conn.migrator.inspector.columnInfo(
        tableName,
        cName,
      );
      expect(newColumns.is_nullable).toBe(
        alteredSchema.columns[cName].isNullable,
      );
    },
    15_000,
  );
});
