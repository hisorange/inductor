import cloneDeep from 'lodash.clonedeep';
import { ColumnType } from '../src/enum/column-type.enum';
import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Nullable Flag', () => {
  let inductor: Inductor;
  const testTables = Object.keys(allColumn);

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.knex.schema.dropTableIfExists(`alter_nullable_${name}`),
      ),
    );
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each(testTables)(
    'should be able to alter the NULLABLE flag for [%s] column',
    async colName => {
      const tableName = `alter_nullable_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          id: {
            kind: 'column',
            type: ColumnType.INTEGER,
            isNullable: false,
            isUnique: false,
            isPrimary: true,
          },
          [colName]: allColumn[colName],
          createdAt: {
            kind: 'column',
            type: ColumnType.DATE,
            isNullable: false,
            isUnique: false,
            isPrimary: false,
          },
        },
      };
      // Set nullable to false
      schemaRV1.columns[colName].isNullable = false;

      // Apply the state
      await inductor.setState([schemaRV1]);

      const columnRV1 = await inductor.migrator.inspector.columnInfo(
        tableName,
        colName,
      );
      expect(columnRV1.is_nullable).toBeFalsy();

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the nullable
      schemaRV2.columns[colName].isNullable = true;

      // Apply the changes
      await inductor.setState([schemaRV2]);

      // Verify the changes
      const columnRV2 = await inductor.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isNullable because the sanity checker may change it for the given column type
      expect(columnRV2.is_nullable).toBe(schemaRV2.columns[colName].isNullable);

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isNullable = false;

      await inductor.setState([schemaRV3]);

      const columnRV3 = await inductor.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isNullable because the sanity checker may change it for the given column type
      expect(columnRV3.is_nullable).toBe(schemaRV3.columns[colName].isNullable);
    },
    5_000,
  );
});
