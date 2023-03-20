import { ColumnType } from '../src';
import { InitiateTable } from '../src/table/initiator';
import { ColumnCapability } from '../src/table/types/column.capability';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Capabilities', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

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
      await driver.setState([table]);
      expect(table).toStrictEqual((await driver.readState([tableName]))[0]);

      await driver.migrator.dropTable(tableName);
    },
  );
});
