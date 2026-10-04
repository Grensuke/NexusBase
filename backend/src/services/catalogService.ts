import fs from 'fs';
import path from 'path';

export interface Capability {
  capability_id: string;
  label: string;
  evidence: any[];
}

export interface Entity {
  entity_id: string;
  name: string;
  status: string;
  modality?: string;
  official_url?: string;
  website_url?: string;
  repository_url?: string;
  documentation_url?: string;
  install_url?: string;
  download_url?: string;
  atomic_capabilities: Capability[];
  metadata_capabilities: Capability[];
}

export interface Catalog {
  entities: Record<string, Entity>;
}

let catalogCache: Catalog | null = null;

export const loadCatalog = (): Catalog => {
  if (catalogCache) return catalogCache;
  const catalogPath = path.join(__dirname, '../../../validation/03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full_reproducible.json');
  const data = fs.readFileSync(catalogPath, 'utf8');
  catalogCache = JSON.parse(data);
  return catalogCache!;
};

export const getEntity = (entityId: string): Entity | undefined => {
  const catalog = loadCatalog();
  return catalog.entities[entityId];
};

export const getVerifiedEntities = (): Entity[] => {
  const catalog = loadCatalog();
  return Object.values(catalog.entities).filter(e => e.status === 'success' || e.status === 'extracted');
};
