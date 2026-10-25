const categories = {
  docker: 'containers',
  postgresql: 'databases',
  redis: 'databases',
  nginx: 'web',
  systemd: 'system',
  backup: 'storage',
};
/** @param {import('@pulse-marketplace/contracts').CatalogModule} row */
export function catalogModule(row) {
  return {
    id: `${row.owner}/${row.id}`,
    moduleId: row.id,
    owner: row.owner,
    name: row.name,
    description: { ru: row.description, en: row.description },
    category: categories[row.id.toLowerCase()] || 'other',
    platforms: row.platforms,
    executionRuntimes: row.executionRuntimes ?? ['native'],
    version: row.version,
    source: row.sourceUrl,
    sha256: row.sha256,
    permissions: row.permissions,
    example: false,
  };
}
export function transitionName(id) {
  return `module-${encodeURIComponent(id).replaceAll('%', '_')}`;
}
