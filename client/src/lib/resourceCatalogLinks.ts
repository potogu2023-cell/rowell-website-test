export interface ResourceCatalogLink {
  href: string;
  label: string;
  description: string;
}

interface ResourceCatalogRule extends ResourceCatalogLink {
  tags: string[];
}

// Each rule links only from an exact, editor-recorded technical tag to a
// catalog collection that represents the same broad product family. These
// links make no claim that an individual SKU is method-equivalent.
const RESOURCE_CATALOG_RULES: ResourceCatalogRule[] = [
  {
    tags: [
      'hplc',
      'column selection',
      'column care',
      'maintenance',
      'method development',
      'mobile phase',
      'reversed phase',
      'stationary phase',
      'uhplc',
    ],
    href: '/products?productTypes=HPLC%20Column',
    label: 'Browse active HPLC columns',
    description: 'Compare active catalog records using the recorded phase, dimensions, particle size, and pH details.',
  },
  {
    tags: ['c18'],
    href: '/categories/c18-columns',
    label: 'Explore C18 HPLC columns',
    description: 'Review the active C18 collection and compare the listed product specifications for your method.',
  },
  {
    tags: ['spe', 'sample preparation', 'extraction'],
    href: '/categories/spe-cartridges',
    label: 'Explore SPE cartridges',
    description: 'Browse active solid-phase extraction cartridges and confirm suitability for the intended workflow.',
  },
];

export function getResourceCatalogLinks(tags: string[]): ResourceCatalogLink[] {
  const normalizedTags = new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
  return RESOURCE_CATALOG_RULES
    .filter((rule) => rule.tags.some((tag) => normalizedTags.has(tag)))
    .map(({ tags: _tags, ...link }) => link);
}
