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
   * Property name to be used for the meta extension.
   */
  readonly property: string;

  /**
   * Function to be called when the meta information is changed.
   */
  onWrite(def: any, value: any): void;

  /**
   * Function to be called when the meta information is read.
   */
  onRead(def: any, value: string): void;
}
