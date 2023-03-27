import { Knex } from 'knex';
import { IChange } from '../../types/change.interface';
import { ColumnType } from '../../types/column-type.enum';
import { IColumn } from '../../types/column.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { generateNativeType } from './utils/native-type.generator';

export const alterDefaultValue = (
  { context: ctx, target }: IChange,
  columnName: string,
  columnDefinition: IColumn,
) => {
  ctx.plan.steps.push({
    query: ctx.knex.schema.alterTable(target.name, builder => {
      let columnBuilder: Knex.ColumnBuilder;

      if (columnDefinition.type.name === ColumnType.ENUM) {
        columnBuilder = builder.enum(columnName, columnDefinition.type.values, {
          useNative: true,
          enumName: columnDefinition.type.nativeName,
        });
      } else if (columnDefinition.type.name === ColumnType.JSON) {
        columnBuilder = builder.json(columnName);
      } else if (columnDefinition.type.name === ColumnType.JSONB) {
        columnBuilder = builder.jsonb(columnName);
      } else {
        columnBuilder = builder.specificType(
          columnName,
          generateNativeType(columnDefinition),
        );
      }

      // Defauls is null
      const isDefaultNull = columnDefinition.defaultValue === null;

      // Add default value
      if (columnDefinition.defaultValue !== undefined) {
        columnBuilder.defaultTo(columnDefinition.defaultValue);
      }

      // Add null default value
      if (isDefaultNull) {
        columnBuilder.nullable();
      }

      columnBuilder.alter({
        alterNullable: false,
        alterType: false,
      });
    }),
    risk: MigrationRisk.LOW,
    description: `Changing column ${columnName} default value`,
    phase: 3,
  });
};
