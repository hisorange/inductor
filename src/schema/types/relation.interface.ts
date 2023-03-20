import { ForeignAction } from './foreign-action.enum';

export interface IRelation<RelationMeta = unknown> {
  /**
   * Name used to define the relation on the model.
   */
  propertyName?: string;

  /**
   * List of local references.
   */
  columns: string[];

  references: {
    /**
     * Name of the foreign table.
     */
    table: string;

    /**
     * List of foreign references.
     */
    columns: string[];
  };

  // Checks for has one and has many relations
  // In case the remote key is the primary key then the relation is a has one
  isLocalUnique: boolean;

  // Action executed on foreign delete
  onDelete: ForeignAction;
  // Action executed on foreign update
  onUpdate: ForeignAction;

  /**
   * Associated metadata with the blueprint
   */
  meta?: RelationMeta;
}
