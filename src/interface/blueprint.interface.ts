export interface IBlueprint {
  /**
   * Bluprint's kind, can define view or table.
   */
  kind: 'table' | 'view';

  /**
   * Blueprint's programatical identified.
   */
  id: string;
}
