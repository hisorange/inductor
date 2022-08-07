import { ISchema } from './schema/schema.interface';

export interface IMigrator {
  dropSchema(schema: ISchema): Promise<void>;
}
