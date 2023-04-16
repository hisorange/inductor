export interface IColumnHook {
  /**
   * Encoder
   */
  onWrite?(subject: string): string;

  /**
   * Decoder
   */
  onRead?(subject: string): string;
}
