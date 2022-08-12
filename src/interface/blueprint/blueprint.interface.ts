import { BlueprintKind } from './blueprint.kind';
import { IColumn } from './column.interface';
import { ICompositiveIndex } from './index.interface';
import { IRelation } from './relation.interface';
import { IUnique } from './unique.interface';

export interface IBlueprint<
  BlueprintMeta = unknown,
  ColumnMeta = unknown,
  UniqueMeta = unknown,
  IndexMeta = unknown,
  RelationMeta = unknown,
> {
  /**
   * Can define view or table.
   */
  kind: BlueprintKind;

  /**
   * Programatical identified. (applied as the table's name)
   */
  tableName: string;

  /**
   * Columns of the table.
   */
  columns: {
    [columnRef: string]: IColumn<ColumnMeta>;
  };

  /**
   * Unique constraints of the table.
   */
  uniques: {
    [uniqueName: string]: IUnique<UniqueMeta>;
  };

  /**
   * Indices of the table.
   */
  indexes: {
    [indexName: string]: ICompositiveIndex<IndexMeta>;
  };

  /**
   * Foreign keys of the table.
   */
  relations: {
    [foreignKeyName: string]: IRelation<RelationMeta>;
  };

  /**
   * Associated metadata with the blueprint
   */
  meta?: BlueprintMeta;
}
