export const categories = ['all', 'containers', 'databases', 'web', 'system', 'storage', 'other'];
export function syncFilterState(state, url) {
  return state.url === url ? state : { url, filters: parseFilters(new URLSearchParams(url)) };
}
export function parseFilters(params) {
  return {
    query: (params.get('q') || '').slice(0, 200),
    platform: ['linux', 'windows'].includes(params.get('platform'))
      ? params.get('platform')
      : 'all',
    category: categories.includes(params.get('category')) ? params.get('category') : 'all',
    sort: params.get('sort') === 'name-desc' ? 'name-desc' : 'name',
  };
}
export function filterQuery(filters) {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.platform !== 'all') params.set('platform', filters.platform);
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.sort !== 'name') params.set('sort', filters.sort);
  return params.toString();
}
export function filterModules(modules, filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return modules
    .filter(
      (module) =>
        (!query ||
          [module.name, ...Object.values(module.description)]
            .join(' ')
            .toLocaleLowerCase()
            .includes(query)) &&
        (filters.category === 'all' || module.category === filters.category) &&
        (filters.platform === 'all' ||
          module.platforms.some((platform) => platform.startsWith(`${filters.platform}-`))),
    )
    .toSorted(
      (a, b) => a.name.localeCompare(b.name, 'en') * (filters.sort === 'name-desc' ? -1 : 1),
    );
}
export function publicModules(previews, environment) {
  return environment === 'development' ? previews : [];
}
