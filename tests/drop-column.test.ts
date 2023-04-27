import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { IndexType } from '../src/types/index-type.enum';
import { ITable } from '../src/types/table.interface';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Drop Column', () => {
  const driver = createTestDriver();
  const clearTables = () =>
    Promise.all(testTables.map(name => driver.migrator.drop(name)));

  const columns: ITable['columns'] = {
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
    await driver.close();
  });

  test.each(Object.keys(columns))(
    'should drop the [%s] column',
    async col => {
      const tableName = `drop_column_${col}`;

      const tableRV1 = InitiateTable(tableName);
      tableRV1.columns = columns;
      await driver.set([tableRV1]);

      expect((await driver.read([tableName]))[0]).toStrictEqual(tableRV1);

      const tableRV2 = cloneDeep(tableRV1);
      delete tableRV2.columns[col];
      await driver.set([tableRV2]);

      expect((await driver.read([tableName]))[0]).toStrictEqual(tableRV2);
    },
    5_000,
  );
});
