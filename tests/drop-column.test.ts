import cloneDeep from 'lodash.clonedeep';
import { ColumnType, IBlueprint, IndexType } from '../src';
import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Drop Column', () => {
  const driver = createTestDriver();
  const clearTables = () =>
    Promise.all(testTables.map(name => driver.migrator.dropTable(name)));

  const columns: IBlueprint['columns'] = {
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

      const blueprintRV1 = initBlueprint(tableName);
      blueprintRV1.columns = columns;
      await driver.setState([blueprintRV1]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      delete blueprintRV2.columns[col];
      await driver.setState([blueprintRV2]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(
        blueprintRV2,
      );
    },
    5_000,
  );
});
