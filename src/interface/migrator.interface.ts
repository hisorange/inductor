import { ISchema } from './schema.interface';

export interface IMigrator {
  dropSchema(schema: ISchema): Promise<void>;
}
