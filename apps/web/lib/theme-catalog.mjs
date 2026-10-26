export function filterThemes(rows, { query = '', mode = 'all' } = {}) {
  const q = query.trim().toLocaleLowerCase();
  return rows
    .filter(
      (x) =>
        (mode === 'all' || x.mode === mode) &&
        (!q || [x.name, x.owner, x.description].join(' ').toLocaleLowerCase().includes(q)),
    )
    .toSorted((a, b) => a.name.localeCompare(b.name, 'en'));
}
export function previewTokens(theme) {
  const style = {};
  const allowed = [
    'bg',
    'surface',
    'surface-hover',
    'raised',
    'text',
    'muted',
    'subtle',
    'border',
    'track',
    'chart-primary',
    'chart-secondary',
    'chart-tertiary',
  ];
  for (const [k, v] of Object.entries(theme.colors)) {
    if (!allowed.includes(k) || !/^#[a-f0-9]{6}$/i.test(v)) throw Error('Invalid preview color');
    style[`--preview-${k}`] = v;
  }
  if (!Number.isFinite(theme.radius) || theme.radius < 0 || theme.radius > 24)
    throw Error('Invalid radius');
  const accent = theme.accent ?? theme.colors['chart-primary'];
  if (!/^#[a-f0-9]{6}$/i.test(accent)) throw Error('Invalid accent');
  return { ...style, '--preview-radius': theme.radius + 'px', '--preview-accent': accent };
}
export const themeCopy = {
  ru: {
    modules: 'Модули',
    themes: 'Темы',
    title: 'Твой Pulse. Твой характер.',
    intro:
      'Оформление, которое хочется оставить открытым. Выбирай тему, смотри её на панели и забирай в свой Monitor.',
    search: 'Найти тему',
    searchHint: 'Название, автор или описание',
    all: 'Все темы',
    dark: 'Тёмные',
    light: 'Светлые',
    preview: 'Предпросмотр',
    download: 'Скачать тему',
    source: 'Исходный код',
    empty: 'Здесь появятся темы сообщества',
    emptyText:
      'Пока нет опубликованных тем. Авторы размещают их на GitHub, каждая версия проходит отдельную модерацию.',
    noResults: 'Темы не найдены',
    reset: 'Сбросить фильтры',
    builtin: 'Встроенные темы Monitor',
    builtinText:
      'Посмотри, как меняется панель. Это встроенные варианты оформления, а не публикации сообщества.',
    demo: 'Макет панели · демонстрационные данные',
    overview: 'Обзор',
    processes: 'Процессы',
    logs: 'Логи',
    cpu: 'Процессор',
    memory: 'Память',
    network: 'Сеть',
    node: 'demo-node',
    palette: 'Палитра',
    install: 'Как применить',
    step1: 'Скачай JSON темы.',
    step2: 'Открой Monitor → Настройки → Внешний вид.',
    step3: 'Нажми «Импортировать тему» и выбери файл.',
    safe: 'Только оформление. Без исполняемого кода, доступа к серверам и установки на агенты.',
    publish: 'Опубликовать свою тему',
    unavailable: 'Каталог временно недоступен. Попробуй обновить страницу.',
    back: 'Все темы',
    version: 'Версия',
    author: 'Автор',
    loading: 'Загружаем темы…',
    themeFile: 'Файл темы',
    packageHash: 'SHA-256 исходного пакета',
    mode: 'Режим',
    darkOne: 'Тёмная',
    lightOne: 'Светлая',
    results: 'Найдено',
    server: 'Сервер',
    status: 'В сети',
    lastLogs: 'Последние логи',
    settings: 'Настройки',
    previewOnly: 'Это предпросмотр, настройки твоей панели не изменяются.',
  },
  en: {
    modules: 'Modules',
    themes: 'Themes',
    title: 'Your Pulse. Your character.',
    intro:
      'A dashboard you want to keep open. Explore a theme on the panel, then bring it to your own Monitor.',
    search: 'Find a theme',
    searchHint: 'Name, author or description',
    all: 'All themes',
    dark: 'Dark',
    light: 'Light',
    preview: 'Preview',
    download: 'Download theme',
    source: 'Source code',
    empty: 'Community themes will appear here',
    emptyText:
      'No themes have been published yet. Authors release them on GitHub; every version is reviewed separately.',
    noResults: 'No matching themes',
    reset: 'Reset filters',
    builtin: 'Built-in Monitor themes',
    builtinText:
      'See how the dashboard changes. These are built-in appearance presets, not community publications.',
    demo: 'Dashboard mockup · illustrative data',
    overview: 'Overview',
    processes: 'Processes',
    logs: 'Logs',
    cpu: 'CPU',
    memory: 'Memory',
    network: 'Network',
    node: 'demo-node',
    palette: 'Palette',
    install: 'How to apply',
    step1: 'Download the theme JSON.',
    step2: 'Open Monitor → Settings → Appearance.',
    step3: 'Choose “Import theme” and select the file.',
    safe: 'Appearance only. No executable code, server access or Agent installation.',
    publish: 'Publish your theme',
    unavailable: 'The catalog is temporarily unavailable. Try refreshing the page.',
    back: 'All themes',
    version: 'Version',
    author: 'Author',
    loading: 'Loading themes…',
    themeFile: 'Theme file',
    packageHash: 'Source package SHA-256',
    mode: 'Mode',
    darkOne: 'Dark',
    lightOne: 'Light',
    results: 'Found',
    server: 'Server',
    status: 'Online',
    lastLogs: 'Recent logs',
    settings: 'Settings',
    previewOnly: 'This is a preview; your Monitor settings stay unchanged.',
  },
};
