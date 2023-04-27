import snakeCase from 'lodash.snakecase';
import { InitiateTable } from '../library/initiators';
import { ColumnType } from '../types/column-type.enum';
import { IColumn } from '../types/column.interface';
import { ITable } from '../types/table.interface';

type ColumnName = string;

/**
 * Build a table descriptor from a json sample.
 */
export const getTableFromJSON = (jsonSample: object | object[]): ITable => {
  // Init a base table.
  const table = InitiateTable(`from_json_${Date.now().toString(36)}`);

  // Check if the jsonSample is an array, if not push into it.
  const sampleArray = Array.isArray(jsonSample) ? jsonSample : [jsonSample];
  const columnMap = new Map<ColumnName, IColumn>();

  sampleArray.forEach(row => {
    const properties = Object.keys(row);
    const columnUniqueSet = new Set<string>();

    // Map the properties into columns.
    for (const alias of properties) {
      let columnName: string;
      let xSuffix = 0;

      do {
        let snakeKey = snakeCase(alias);
        columnName = xSuffix ? `${snakeKey}_${xSuffix}` : snakeKey;

        // Find the first column name which does not collide for this row.
        if (!columnUniqueSet.has(columnName)) {
          columnUniqueSet.add(columnName);
          break;
        }
      } while (++xSuffix && xSuffix <= 999);

      const previous = columnMap.get(columnName);
      const value = row[alias];
      let isPassed = false;

      // Start from the strictest type matcher and go for the more allowing ones.
      if (testBoolean(value)) {
        if (!previous || previous.type.name === ColumnType.BOOLEAN) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.BOOLEAN },
            isNullable: previous?.isNullable || false,
            defaultValue: undefined,
          });

          isPassed = true;
        }
      }

      // Test for UUID
      if (!isPassed && testUUID(value)) {
        if (!previous || previous.type.name === ColumnType.UUID) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.UUID },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Test for Date
      if (!isPassed && testDate(value)) {
        if (!previous || previous.type.name === ColumnType.TIMESTAMP) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.TIMESTAMP },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Test for BigInt
      if (!isPassed && testBigInt(value)) {
        if (!previous || previous.type.name === ColumnType.BIGINT) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.BIGINT },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Test for Int
      if (!isPassed && testInt(value)) {
        if (!previous || previous.type.name === ColumnType.INTEGER) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.INTEGER },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Test for Float / Double
      if (!isPassed && testFloat(value)) {
        if (!previous || previous.type.name === ColumnType.DOUBLE) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.DOUBLE },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Test for Buffer
      if (!isPassed && testFloat(value)) {
        if (!previous || previous.type.name === ColumnType.DOUBLE) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.DOUBLE },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Test for Array | Pojo
      if (!isPassed && (Array.isArray(value) || typeof value === 'object')) {
        if (!previous || previous.type.name === ColumnType.JSONB) {
          columnMap.set(columnName, {
            meta: { alias },
            type: { name: ColumnType.JSONB },
            isNullable: previous?.isNullable || false,
            defaultValue: previous?.defaultValue || undefined,
          });

          isPassed = true;
        }
      }

      // Fallback for TEXT
      if (!isPassed) {
        if (!previous || previous.type.name !== ColumnType.TEXT) {
          // It's null now, but we have a proper definition, can be any type but nullable.
          if (value === null && previous) {
            columnMap.set(columnName, {
              ...previous,
              defaultValue: null,
              isNullable: true,
            });
          } else {
            columnMap.set(columnName, {
              meta: { alias },
              type: { name: ColumnType.TEXT },
              isNullable: previous?.isNullable || value === null,
              defaultValue:
                value === null
                  ? null
                  : previous?.defaultValue || value === null
                  ? null
                  : undefined,
            });
          }

          isPassed = true;
        }
      }
    }
  });

  let foundId = false;

  for (const [columnName, columnDef] of columnMap.entries()) {
    // Common identifiers, we can promote it as primary key.
    if (!foundId && (columnName === 'id' || columnName === '_id')) {
      columnDef.isPrimary = true;
      columnDef.isNullable = false;
      columnDef.defaultValue = undefined;

      if (columnDef.type.name === ColumnType.INTEGER) {
        columnDef.type.name = ColumnType.SERIAL;
      }

      foundId = true;
    }

    table.columns[columnName] = columnDef;
  }

  return table;
};

const testBoolean = (value: any) => typeof value === 'boolean';
const testUUID = (value: any) =>
  typeof value === 'string' &&
  value.match(
    /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-fA-F0-9]{32}$/,
  );
const testDate = (value: any) =>
  (typeof value === 'object' && value instanceof Date) ||
  (typeof value === 'string' && !isNaN(new Date(value).getTime()));
const testBigInt = (value: any) => typeof value === 'bigint';
const testInt = (value: any) =>
  typeof value === 'number' && Math.round(value) === value;
const testFloat = (value: any) =>
  typeof value === 'number' && Math.round(value) !== value;
