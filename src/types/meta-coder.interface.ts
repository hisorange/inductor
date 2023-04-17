import type { Pojo } from 'objection';

export interface IMetaExtension {
  /**
   * Unique identifier of the meta extension.
   */
  readonly id: string;

  /**
   * Interest when to be applied.
   */
  readonly interest:
    | 'column'
    | 'table'
    | 'database'
    | 'relation'
    | 'index'
    | 'unique'
    | 'enum';

  /**
   * Function to be called when the meta information is changed.
   */
  onWrite(comment: Pojo, meta: Pojo): void;

  /**
   * Function to be called when the meta information is read.
   */
  onRead(comment: Pojo, meta: Pojo): void;
}
