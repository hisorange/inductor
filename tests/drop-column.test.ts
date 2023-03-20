import cloneDeep from 'lodash.clonedeep';
import { ColumnType, IndexType, ISchema } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Drop Column', () => {
  const driver = createTestDriver();
  const clearTables = () =>
    Promise.all(testTables.map(name => driver.migrator.dropTable(name)));

  const columns: ISchema['columns'] = {
    col_var_1: {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    },
    col_var_2: {
      ...createTestColumn(ColumnType.INTEGER),
      isNullable: true,
      defaultValue: null,
    },
    col_var_3: {
      ...createTestColumn(ColumnType.INTEGER),
      isUnique: true,
    },
    col_var_4: {
      ...createTestColumn(ColumnType.INTEGER),
      isIndexed: IndexType.BTREE,
    },
  };

  const testTables = Object.keys(columns).map(name => `drop_column_${name}`);

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await driver.closeConnection();
  });

  test.each(Object.keys(columns))(
    'should drop the [%s] column',
    async col => {
      const tableName = `drop_column_${col}`;

      const schemaRV1 = InitiateSchema(tableName);
      schemaRV1.columns = columns;
      await driver.setState([schemaRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaRV1);

      const schemaRV2 = cloneDeep(schemaRV1);
      delete schemaRV2.columns[col];
      await driver.setState([schemaRV2]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaRV2);
    },
    5_000,
  );
});
