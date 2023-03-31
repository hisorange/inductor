import { IChange } from '../../types/change.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { encodeTableMeta } from '../../utils/meta.coder';

export const alterTableMeta = ({ context, target }: IChange) => {
  context.plan.steps.push({
    query: context.knex.schema.raw(
      `COMMENT ON TABLE "${context.knex.raw(
        target.name,
      )}" IS '${context.knex.raw(encodeTableMeta(target))}'`,
    ),
    risk: MigrationRisk.NONE,
    description: `Changing table ${target.name} comment`,
    phase: 3,
  });
};
