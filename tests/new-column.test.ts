import cloneDeep from 'lodash.clonedeep';
import { ColumnType, ImpossibleMigration } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Able to handle new column risks', () => {
  const driver = createTestDriver();
  afterAll(() => driver.closeConnection());

  test('should be able to create a new column with default value', async () => {
    const tableName = `new_column_test_with_def_42`;
    const blueprintRV1 = InitiateSchema(tableName);
    blueprintRV1.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      name: createTestColumn(ColumnType.TEXT),
    };

    await driver.setState([blueprintRV1]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const modelRV1 = driver.getModel(tableName);
    await modelRV1.query().insert({ name: 'duckling' });

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns['new_column'] = {
      ...createTestColumn(ColumnType.INTEGER),
      defaultValue: 42,
    };

    await driver.setState([blueprintRV2]);
    const modelRV2 = driver.getModel(tableName);
    await modelRV2.query().insert({ name: 'lama' });

    expect((await driver.readState([tableName]))[0]).toStrictEqual(
      blueprintRV2,
    );
  });

  test('should be possible to create new column without default value with zero rows', async () => {
    const tableName = `new_column_test_w_defv`;
    const blueprintRV1 = InitiateSchema(tableName);
    blueprintRV1.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      name: createTestColumn(ColumnType.TEXT),
    };

    await driver.setState([blueprintRV1]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns['new_column_without_defv'] = createTestColumn(
      ColumnType.INTEGER,
    );

    await expect(driver.setState([blueprintRV2])).resolves.not.toThrow();
  });

  test('should be impossible to create new column without default value with non-zero rows', async () => {
    const tableName = `new_column_test_wo_defv`;
    const blueprintRV1 = InitiateSchema(tableName);
    blueprintRV1.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
      },
      name: createTestColumn(ColumnType.TEXT),
    };

    await driver.setState([blueprintRV1]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const modelRV1 = driver.getModel(tableName);
    await modelRV1.query().insert({ name: 'poc' });

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns['new_column_without_defv'] = createTestColumn(
      ColumnType.INTEGER,
    );

    await expect(driver.setState([blueprintRV2])).rejects.toBeInstanceOf(
      ImpossibleMigration,
    );
  });
});
