import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Column Alias', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

  afterAll(() => driver.close());

  test('should be able to add/remove a column alias', async () => {
    const tableName = 'column_alias_test';
    const tableRV1 = InitiateTable(tableName);

    // Drop table if exists from a previous test
    await driver.migrator.drop(tableName);

    tableRV1.columns = {
      primary_column: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      with_alias: {
        ...createTestColumn(ColumnType.INTEGER),
      },
    };

    tableRV1.columns.with_alias.meta.alias = 'theAlias';

    await toEqual(tableRV1);

    const tableRV2 = cloneDeep(tableRV1);

    delete tableRV2.columns.with_alias.meta.alias;

    await toEqual(tableRV2);

    const tableRV3 = cloneDeep(tableRV2);
    tableRV3.columns.with_alias.meta.alias = 'withCAP23';

    await toEqual(tableRV3);

    await driver.migrator.drop(tableName);
  });
});
