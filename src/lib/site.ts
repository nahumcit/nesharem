import { languages, topicLabels, ui, type Lang, type UIKey } from '../i18n/ui';

export { languages, topicLabels, ui };
export type { Lang, UIKey };

export const localeFor: Record<Lang, string> = {
  es: 'es-CR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function t(lang: Lang, key: UIKey, vars?: Record<string, string | number>): string {
  let value = ui[lang][key] ?? ui.es[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function pathFor(lang: Lang, path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${lang}/${clean}` : `/${lang}/`;
}

export function swapLang(pathname: string, lang: Lang): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${lang}/`;
  if (languages.includes(parts[0] as Lang)) {
    parts[0] = lang;
  } else {
    parts.unshift(lang);
  }
  return `/${parts.join('/')}${pathname.endsWith('/') ? '/' : ''}`;
}

export function formatDate(date: Date, lang: Lang, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat(localeFor[lang], {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatMonth(month: number, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor[lang], {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, month - 1, 1)));
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function prettify(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function topicLabel(topic: string, lang: Lang): string {
  return topicLabels[topic]?.[lang] ?? prettify(topic);
}

const statusKeys: Record<string, UIKey> = {
  watching: 'statusWatching',
  completed: 'statusCompleted',
  planned: 'statusPlanned',
  dropped: 'statusDropped',
  playing: 'statusPlaying',
  played: 'statusPlayed',
  paused: 'statusPaused',
  reading: 'statusReading',
  read: 'statusRead',
  onhold: 'statusOnHold',
};

export function interestLabel(key: string, lang: Lang): string {
  const uiKey = `interest${key.charAt(0).toUpperCase()}${key.slice(1)}` as UIKey;
  return ui[lang][uiKey] ?? prettify(key);
}

export function hobbyLabel(key: string, lang: Lang): string {
  const uiKey = `hobby${key.charAt(0).toUpperCase()}${key.slice(1)}` as UIKey;
  return ui[lang][uiKey] ?? prettify(key);
}

export function statusLabel(status: string, lang: Lang): string {
  const key = statusKeys[status];
  return key ? t(lang, key) : prettify(status);
}

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
