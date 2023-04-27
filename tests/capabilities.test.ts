import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { ColumnCapability } from '../src/types/column.capability';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Capabilities', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

  afterAll(() => driver.close());

  test.each([
    ['CREATED_AT', ColumnCapability.CREATED_AT],
    ['UPDATED_AT', ColumnCapability.UPDATED_AT],
    ['DELETED_AT', ColumnCapability.DELETED_AT],
  ])(
    'should be able to associate [%s] capabilities with a column',
    async (ref: string, cap: ColumnCapability) => {
      const tableName = `capability_${ref}`;
      const columnName = 'cappedColumn' + cap;

      // Drop table if exists from a previous test
      await driver.migrator.drop(tableName);

      const table = InitiateTable(tableName);
      table.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: {
          ...createTestColumn(ColumnType.DATE),
        },
      };

      table.columns[columnName].meta.capabilities = [cap];

      await toEqual(table);
      await driver.migrator.drop(tableName);
    },
  );

  test('should be able to add/remove a column capability', async () => {
    const tableName = 'capability_alter';
    const table = InitiateTable(tableName);

    // Drop table if exists from a previous test
    await driver.migrator.drop(tableName);

    table.columns = {
      primary_column: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      with_cap: {
        ...createTestColumn(ColumnType.TIMESTAMP),
      },
    };

    table.columns.with_cap.meta.capabilities = [ColumnCapability.CREATED_AT];

    await toEqual(table);

    const tableV2 = cloneDeep(table);
    tableV2.columns.with_cap.meta.capabilities = [];

    await toEqual(tableV2);

    const tableV3 = cloneDeep(tableV2);
    tableV3.columns.with_cap.meta.capabilities = [ColumnCapability.UPDATED_AT];

    await toEqual(tableV3);
    await driver.migrator.drop(tableName);
  });
});
