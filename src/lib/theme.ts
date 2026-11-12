export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'careerconnect-theme';

export function getTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'system';
    }

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
    }

    return 'system';
}

export function applyTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
    ).matches;

    const dark = theme === 'dark' ||
        (theme === 'system' && systemDark);

    document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
}