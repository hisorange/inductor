import { genSaltSync, hashSync } from 'bcrypt';
import { ITransformer } from '../types/transformer.interface';

export const PasswordHashTransformer: ITransformer = {
  onWrite: (plain: string): string =>
    plain ? hashSync(plain, genSaltSync(4)) : plain,
};
