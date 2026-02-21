import type { ModuleId } from './registry';

export interface CrossModuleLink {
  sourceModule: ModuleId;
  sourceEntityId: string;
  targetModule: ModuleId;
  targetEntityId: string;
  linkType: string;
}
