import { ColumnType } from '../src/types/column-type.enum';
import { getTableFromJSON } from '../src/utils/get-table-from-json';

describe('Table from JSON', () => {
  test('should recommend optimal blocks from a single input', () => {
    const table = getTableFromJSON({
      num: 1,
      txt: 'b',
      bool: false,
      uuid1: 'e6943076-2a32-4432-b5b6-bc99d31baf6d',
      uuid2: 'e6943076-2a32-4432-b5b6-bc99d31baf6d'.toUpperCase(),
      uuid3: 'e6943076-2a32-4432-b5b6-bc99d31baf6d'.replace(/-/g, ''),
      uuid4: 'e6943076-2a32-4432-b5b6-bc99d31baf6d'
        .replace(/-/g, '')
        .toUpperCase(),
      date1: '2022-10-10',
      bigint: BigInt('555'),
      money: 122.5,
      arr: [1, '2', true],
      sub: {},
    });

    expect(table.columns).toHaveProperty('num');
    expect(table.columns).toHaveProperty('txt');
    expect(table.columns).toHaveProperty('bool');
    expect(table.columns).toHaveProperty('uuid_1');
    expect(table.columns).toHaveProperty('uuid_2');
    expect(table.columns).toHaveProperty('uuid_3');
    expect(table.columns).toHaveProperty('uuid_4');
    expect(table.columns).toHaveProperty('date_1');
    expect(table.columns).toHaveProperty('bigint');
    expect(table.columns).toHaveProperty('money');
    expect(table.columns).toHaveProperty('arr');
    expect(table.columns).toHaveProperty('sub');

    expect(table.columns.num.type.name).toBe(ColumnType.INTEGER);
    expect(table.columns.num.isNullable).toBeFalsy();
    expect(table.columns.num.defaultValue).not.toBeDefined();

    expect(table.columns.txt.type.name).toBe(ColumnType.TEXT);
    expect(table.columns.txt.isNullable).toBeFalsy();
    expect(table.columns.txt.defaultValue).not.toBeDefined();

    expect(table.columns.bool.type.name).toBe(ColumnType.BOOLEAN);
    expect(table.columns.bool.isNullable).toBeFalsy();
    expect(table.columns.bool.defaultValue).not.toBeDefined();

    expect(table.columns.uuid_1.type.name).toBe(ColumnType.UUID);
    expect(table.columns.uuid_1.isNullable).toBeFalsy();
    expect(table.columns.uuid_1.defaultValue).not.toBeDefined();

    expect(table.columns.uuid_2.type.name).toBe(ColumnType.UUID);
    expect(table.columns.uuid_2.isNullable).toBeFalsy();
    expect(table.columns.uuid_2.defaultValue).not.toBeDefined();

    expect(table.columns.uuid_3.type.name).toBe(ColumnType.UUID);
    expect(table.columns.uuid_3.isNullable).toBeFalsy();
    expect(table.columns.uuid_3.defaultValue).not.toBeDefined();

    expect(table.columns.uuid_4.type.name).toBe(ColumnType.UUID);
    expect(table.columns.uuid_4.isNullable).toBeFalsy();
    expect(table.columns.uuid_4.defaultValue).not.toBeDefined();

    expect(table.columns.date_1.type.name).toBe(ColumnType.TIMESTAMP);
    expect(table.columns.date_1.isNullable).toBeFalsy();
    expect(table.columns.date_1.defaultValue).not.toBeDefined();

    expect(table.columns.bigint.type.name).toBe(ColumnType.BIGINT);
    expect(table.columns.bigint.isNullable).toBeFalsy();
    expect(table.columns.bigint.defaultValue).not.toBeDefined();

    expect(table.columns.money.type.name).toBe(ColumnType.DOUBLE);
    expect(table.columns.money.isNullable).toBeFalsy();
    expect(table.columns.money.defaultValue).not.toBeDefined();

    expect(table.columns.arr.type.name).toBe(ColumnType.JSONB);
    expect(table.columns.arr.isNullable).toBeFalsy();
    expect(table.columns.arr.defaultValue).not.toBeDefined();

    expect(table.columns.sub.type.name).toBe(ColumnType.JSONB);
    expect(table.columns.sub.isNullable).toBeFalsy();
    expect(table.columns.sub.defaultValue).not.toBeDefined();
  });
});
