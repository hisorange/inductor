import { InductorException } from './inductor.exception';

export class UnsupportedProvider extends InductorException {
  constructor(provider: string) {
    super(`Unsupported database provider: ${provider}`);
  }
}
