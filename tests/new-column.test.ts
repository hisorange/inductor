import cloneDeep from 'lodash.clonedeep';
import { ImpossibleMigration } from '../src/exception/impossible-migration.exception';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Able to handle new column risks', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

  afterAll(() => driver.close());

  test('should be able to create a new column with default value', async () => {
    const tableName = `new_column_test_with_def_42`;
    const tableRV1 = InitiateTable(tableName);
    tableRV1.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      name: createTestColumn(ColumnType.TEXT),
    };

    await toEqual(tableRV1);

    const modelRV1 = driver.models.getModel(tableName);
    await modelRV1.query().insert({ name: 'duckling' });

    const tableRV2 = cloneDeep(tableRV1);
    tableRV2.columns['new_column'] = {
      ...createTestColumn(ColumnType.INTEGER),
      defaultValue: 42,
    };

    const stateRV2 = cloneDeep(driver.database);
    stateRV2.tables = [tableRV2];

    await driver.set(stateRV2);
    const modelRV2 = driver.models.getModel(tableName);
    await modelRV2.query().insert({ name: 'lama' });

    await toEqual(tableRV2);
  });

  test('should be possible to create new column without default value with zero rows', async () => {
    const tableName = `new_column_test_w_defv`;
    const tableRV1 = InitiateTable(tableName);
    tableRV1.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      name: createTestColumn(ColumnType.TEXT),
    };

    await toEqual(tableRV1);

    const tableRV2 = cloneDeep(tableRV1);
    tableRV2.columns['new_column_without_defv'] = createTestColumn(
      ColumnType.INTEGER,
    );

    await toEqual(tableRV2);
  });

  test('should be impossible to create new column without default value with non-zero rows', async () => {
    const tableName = `new_column_test_wo_defv`;
    const tableRV1 = InitiateTable(tableName);
    tableRV1.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      name: createTestColumn(ColumnType.TEXT),
    };

    await toEqual(tableRV1);

    const modelRV1 = driver.models.getModel(tableName);
    await modelRV1.query().insert({ name: 'poc' });

    const tableRV2 = cloneDeep(tableRV1);
    tableRV2.columns['new_column_without_defv'] = createTestColumn(
      ColumnType.INTEGER,
    );

    const stateRV2 = cloneDeep(driver.database);
    stateRV2.tables = [tableRV2];

    await expect(driver.set(stateRV2)).rejects.toBeInstanceOf(
      ImpossibleMigration,
    );

    await driver.migrator.drop(tableName);
  });
});
