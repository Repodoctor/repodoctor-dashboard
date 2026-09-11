export type FindingCategory = 'code' | 'secrets' | 'supply-chain';

const SECRET_SOURCES = new Set(['SECURITY']);
const SUPPLY_CHAIN_SOURCES = new Set(['DEPENDENCY']);

export function findingCategory(source: string): FindingCategory {
  if (SECRET_SOURCES.has(source)) return 'secrets';
  if (SUPPLY_CHAIN_SOURCES.has(source)) return 'supply-chain';
  return 'code';
}

export function isFindingCategory(source: string, category: FindingCategory): boolean {
  return findingCategory(source) === category;
}

export function categoryPath(category: FindingCategory): string {
  if (category === 'secrets') return '/secrets';
  if (category === 'supply-chain') return '/supply-chain';
  return '/code';
}
