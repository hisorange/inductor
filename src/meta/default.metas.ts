import { ColumnAliasMeta } from './column-alias.meta';
import { ColumnCapabilitiesMeta } from './column-capabilities.meta';
import { ColumnDescriptionMeta } from './column-description.meta';
import { ColumnHookMeta } from './column-hook.meta';
import { RelationAliasMeta } from './relation-alias.meta';
import { TableAliasMeta } from './table-alias.meta';
import { TableDescriptionMeta } from './table-description.meta';
import { TableIdMeta } from './table-id.meta';

export const defaultMetaExtensions = [
  ColumnAliasMeta,
  ColumnCapabilitiesMeta,
  ColumnDescriptionMeta,
  ColumnHookMeta,
  RelationAliasMeta,
  TableAliasMeta,
  TableDescriptionMeta,
  TableIdMeta,
];
