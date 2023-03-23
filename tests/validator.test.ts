import { InitiateTable } from '../src/library/table.initiator';
import { ValidateTable } from '../src/library/table.validator';
import { ColumnType } from '../src/types/column-type.enum';

describe('Alter Nullable', () => {
  test('Invalid default value for enum', async () => {
    const table = InitiateTable('_invalid_enum_default_value');
    table.columns = {
      invalid: {
        isIndexed: false,
        isNullable: false,
        isPrimary: false,
        isUnique: false,
        defaultValue: 'd',
        capabilities: [],
        type: {
          name: ColumnType.ENUM,
          values: ['a', 'b', 'c'],
          nativeName: 'enum_x',
        },
      },
    };

    expect(() => ValidateTable(table)).toThrowError(
      'Enumerated column [invalid] default value is not one of the values',
    );
  });
});
