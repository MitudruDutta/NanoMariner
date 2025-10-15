import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const rootDir = resolve(__dirname);
const outDir = resolve(rootDir, 'dist');

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      {
        name: 'generate-manifest',
        writeBundle() {
          // Create a static manifest.json based on the JavaScript manifest
          const distManifestPath = resolve(outDir, 'manifest.json');
          
          const manifest = {
            "manifest_version": 3,
            "name": "NanoMariner",
            "version": "0.1.0",
            "description": "AI-powered browser automation extension",
            "host_permissions": ["<all_urls>"],
            "permissions": ["storage", "scripting", "tabs", "activeTab", "debugger", "unlimitedStorage", "webNavigation"],
            "options_page": "options.html",
            "background": {
              "service_worker": "background.js",
              "type": "module"
            },
            "action": {
              "default_icon": "icon-32.png",
              "default_popup": "index.html"
            },
            "icons": {
              "128": "icon-128.png"
            },
            "content_scripts": [
              {
                "matches": ["http://*/*", "https://*/*", "<all_urls>"],
                "all_frames": true,
                "js": ["contentScript.js"]
              }
            ],
            "web_accessible_resources": [
              {
                "resources": [
                  "*.js",
                  "*.css",
                  "*.svg",
                  "icon-128.png",
                  "icon-32.png",
                  "permission/index.html",
                  "permission/permission.js"
                ],
                "matches": ["*://*/*"]
              }
            ]
          };
          
          fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));
          console.log('✓ Manifest generated and copied to dist folder');
        }
      }
    ],
    resolve: {
      alias: {
        '@src': resolve(rootDir, 'src'),
        '@extension/storage': resolve(rootDir, 'src/compat/extension/storage'),
        '@extension/i18n': resolve(rootDir, 'src/compat/extension/i18n'),
        stream: resolve(rootDir, 'src/compat/shims/stream.ts'),
        'child_process': resolve(rootDir, 'src/compat/shims/child_process.ts'),
        // Order matters: map 'fs/promises' before 'fs' to avoid resolving to fs.ts/promises
        'fs/promises': resolve(rootDir, 'src/compat/shims/fs.promises.ts'),
        fs: resolve(rootDir, 'src/compat/shims/fs.ts'),
        path: resolve(rootDir, 'src/compat/shims/path.ts'),
        crypto: resolve(rootDir, 'src/compat/shims/crypto.ts'),
      },
    },
    publicDir: resolve(rootDir, 'public'),
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(rootDir, 'index.html'),
          background: resolve(rootDir, 'src/background-simple.ts'),
          contentScript: resolve(rootDir, 'src/contentScript.ts'),
          options: resolve(rootDir, 'options.html'),
        },
        output: {
          entryFileNames: assetInfo => {
            if (assetInfo.name?.includes('background')) return 'background.js';
            if (assetInfo.name?.includes('contentScript')) return 'contentScript.js';
            return 'assets/[name].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    },
    base: './'
  };
});


