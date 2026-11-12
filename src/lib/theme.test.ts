
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { applyTheme, getTheme, setTheme } from './theme.ts';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

let savedTheme: string | null = null;
let systemDark = false;
let darkEnabled = false;

function setupBrowser() {
    savedTheme = null;
    systemDark = false;
    darkEnabled = false;

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            matchMedia: () => ({ matches: systemDark })
        }
    });

    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (key: string) =>
                key === 'careerconnect-theme' ? savedTheme : null,

            setItem: (key: string, value: string) => {
                if (key === 'careerconnect-theme') {
                    savedTheme = value;
                }
            }
        }
    });

    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            documentElement: {
                classList: {
                    toggle: (name: string, enabled: boolean) => {
                        if (name === 'dark') darkEnabled = enabled;
                    }
                }
            }
        }
    });
}

function restoreGlobal(name: string, descriptor?: PropertyDescriptor) {
    if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
    } else {
        Reflect.deleteProperty(globalThis, name);
    }
}

afterEach(() => {
    restoreGlobal('window', originalWindow);
    restoreGlobal('document', originalDocument);
    restoreGlobal('localStorage', originalStorage);
});

test('defaults to system when no preference is saved', () => {
    setupBrowser();

    assert.equal(getTheme(), 'system');
});

test('restores a previously saved preference', () => {
    setupBrowser();

    savedTheme = 'dark';

    assert.equal(getTheme(), 'dark');
});

test('ignores invalid stored preferences', () => {
    setupBrowser();

    savedTheme = 'invalid';

    assert.equal(getTheme(), 'system');
});

test('dark theme enables the dark class', () => {
    setupBrowser();

    applyTheme('dark');

    assert.equal(darkEnabled, true);
});

test('light theme disables the dark class', () => {
    setupBrowser();

    systemDark = true;
    applyTheme('light');

    assert.equal(darkEnabled, false);
});

test('system theme follows the device preference', () => {
    setupBrowser();

    systemDark = true;
    applyTheme('system');
    assert.equal(darkEnabled, true);

    systemDark = false;
    applyTheme('system');
    assert.equal(darkEnabled, false);
});

test('setting a theme saves and applies the preference', () => {
    setupBrowser();

    setTheme('dark');

    assert.equal(savedTheme, 'dark');
    assert.equal(getTheme(), 'dark');
    assert.equal(darkEnabled, true);

    setTheme('light');

    assert.equal(savedTheme, 'light');
    assert.equal(darkEnabled, false);
});

test('returns system when running without a browser', () => {
    restoreGlobal('window', originalWindow);

    // In Node's test environment, window is normally undefined.
    assert.equal(getTheme(), 'system');
});
