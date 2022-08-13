import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../../src';
import { ImpossibleMigration } from '../../src/exception/impossible-migration.exception';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Able to handle new column risks', () => {
  const inductor = createTestInstance();
  afterAll(() => inductor.close());

  test('should be able to create a new column with default value', async () => {
    const tableName = `new_column_test`;
    const blueprintRV1 = createBlueprint(tableName);
    blueprintRV1.columns = {
      id: {
        ...createColumnWithType(PostgresColumnType.SERIAL),
        isPrimary: true,
      },
      name: createColumnWithType(PostgresColumnType.TEXT),
    };

    await inductor.migrate([blueprintRV1]);

    expect((await inductor.reverse([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const modelRV1 = inductor.model(tableName);
    await modelRV1.query().insert({ name: 'duckling' });

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns['new_column'] = {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      defaultValue: 42,
    };

    await inductor.migrate([blueprintRV2]);
    const modelRV2 = inductor.model(tableName);
    await modelRV2.query().insert({ name: 'lama' });

    expect((await inductor.reverse([tableName]))[0]).toStrictEqual(
      blueprintRV2,
    );
  });

  test('should be possible to create new column without default value with zero rows', async () => {
    const tableName = `new_column_test_w_defv`;
    const blueprintRV1 = createBlueprint(tableName);
    blueprintRV1.columns = {
      id: {
        ...createColumnWithType(PostgresColumnType.SERIAL),
        isPrimary: true,
      },
      name: createColumnWithType(PostgresColumnType.TEXT),
    };

    await inductor.migrate([blueprintRV1]);

    expect((await inductor.reverse([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns['new_column_without_defv'] = createColumnWithType(
      PostgresColumnType.INTEGER,
    );

    await expect(inductor.migrate([blueprintRV2])).resolves.not.toThrow();
  });

  test('should be impossible to create new column without default value with non-zero rows', async () => {
    const tableName = `new_column_test_wo_defv`;
    const blueprintRV1 = createBlueprint(tableName);
    blueprintRV1.columns = {
      id: {
        ...createColumnWithType(PostgresColumnType.SERIAL),
        isPrimary: true,
      },
      name: createColumnWithType(PostgresColumnType.TEXT),
    };

    await inductor.migrate([blueprintRV1]);

    expect((await inductor.reverse([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const modelRV1 = inductor.model(tableName);
    await modelRV1.query().insert({ name: 'poc' });

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns['new_column_without_defv'] = createColumnWithType(
      PostgresColumnType.INTEGER,
    );

    await expect(inductor.migrate([blueprintRV2])).rejects.toBeInstanceOf(
      ImpossibleMigration,
    );
  });
});
