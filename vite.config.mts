import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist/browser');

// Files that must sit next to index.html for the extension to load (mirrors the
// old angular.json "assets" list).
const staticAssets = ['manifest.json', 'glossary.json', 'config.json'];

function copyExtensionAssets(): Plugin {
    return {
        name: 'copy-extension-assets',
        apply: 'build',
        closeBundle() {
            mkdirSync(outDir, { recursive: true });
            for (const file of staticAssets) {
                copyFileSync(resolve(root, file), resolve(outDir, file));
            }
            cpSync(resolve(root, 'assets'), resolve(outDir, 'assets'), { recursive: true });
        },
    };
}

export default defineConfig({
    root,
    base: './',
    publicDir: false,
    cacheDir: resolve(__dirname, 'node_modules/.vite'),
    plugins: [react(), copyExtensionAssets()],
    css: {
        preprocessorOptions: {
            scss: { loadPaths: [__dirname] },
        },
    },
    build: {
        outDir,
        emptyOutDir: true,
        assetsDir: 'bundle',
        sourcemap: true,
        rollupOptions: {
            input: resolve(root, 'index.html'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [resolve(root, 'testing/setup-tests.ts')],
        include: ['**/*.test.{ts,tsx}'],
    },
});
