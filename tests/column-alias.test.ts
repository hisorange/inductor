import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Column Alias', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test('should be able to add/remove a column alias', async () => {
    const tableName = 'column_alias_test';
    const table = InitiateTable(tableName);

    // Drop table if exists from a previous test
    await driver.migrator.drop(tableName);

    table.columns = {
      primary_column: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      with_alias: {
        ...createTestColumn(ColumnType.INTEGER),
        alias: 'withCAP',
      },
    };

    await driver.set([table]);
    expect(table).toStrictEqual((await driver.read([tableName]))[0]);

    const tableV2 = cloneDeep(table);

    delete tableV2.columns.with_alias.alias;

    await driver.set([tableV2]);
    expect(tableV2).toStrictEqual((await driver.read([tableName]))[0]);

    const tableV3 = cloneDeep(tableV2);
    tableV3.columns.with_alias.alias = 'withCAP23';

    await driver.set([tableV3]);
    expect(tableV3).toStrictEqual((await driver.read([tableName]))[0]);

    await driver.migrator.drop(tableName);
  });
});
