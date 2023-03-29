import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { ColumnCapability } from '../src/types/column.capability';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Capabilities', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test.each([
    ['CREATED_AT', ColumnCapability.CREATED_AT],
    ['UPDATED_AT', ColumnCapability.UPDATED_AT],
    ['DELETED_AT', ColumnCapability.DELETED_AT],
    ['VERSION', ColumnCapability.VERSION],
  ])(
    'should be able to associate [%s] capabilities with a column',
    async (ref: string, cap: ColumnCapability) => {
      const tableName = `capability_${ref}`;

      const table = InitiateTable(tableName);
      table.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        cappedColumn: {
          ...createTestColumn(ColumnType.INTEGER),
          capabilities: [cap],
        },
      };

      if (cap !== ColumnCapability.CREATED_AT) {
        table.columns.cappedColumn.capabilities.push(
          ColumnCapability.CREATED_AT,
        );
      }

      // Remove table if exists from a previous test
      await driver.set([table]);
      expect(table).toStrictEqual((await driver.read([tableName]))[0]);

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
        ...createTestColumn(ColumnType.INTEGER),
        capabilities: [ColumnCapability.CREATED_AT],
      },
    };

    await driver.set([table]);
    expect(table).toStrictEqual((await driver.read([tableName]))[0]);

    const tableV2 = cloneDeep(table);

    tableV2.columns.with_cap.capabilities = [];

    await driver.set([tableV2]);
    expect(tableV2).toStrictEqual((await driver.read([tableName]))[0]);

    const tableV3 = cloneDeep(tableV2);
    tableV3.columns.with_cap.capabilities = [ColumnCapability.UPDATED_AT];

    await driver.set([tableV3]);
    expect(tableV3).toStrictEqual((await driver.read([tableName]))[0]);

    await driver.migrator.drop(tableName);
  });
});
