export interface ITransformer {
  /**
   * Encoder
   */
  onWrite?(subject: string): string;

  /**
   * Decoder
   */
  onRead?(subject: string): string;
}
