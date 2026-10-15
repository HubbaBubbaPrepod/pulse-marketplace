export function applyThemeStorageEvent(event, root) {
  if (event.key !== 'pulse-market.theme.v1') return false;
  root.dataset.theme = event.newValue === 'light' ? 'light' : 'dark';
  return true;
}
