#!/usr/bin/env node
/*
 * CHAOS TETHER — Zero-dependency production build & Brotli-11 / Gzip-9 budget verifier.
 * Keeps root index.html 100% directly servable while generating an optimized dist/ bundle.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const JS_FILES = ['src/audio.js', 'src/space.js', 'src/titleScene.js', 'src/powerupIcons.js', 'src/ships.js', 'src/renderer.js', 'src/game.js'];
const FONT_FILES = ['fonts/orbitron-latin.woff2', 'fonts/chakra-petch-latin.woff2'];
const ASSET_FILES = ['assets/title-bg-1080p.webp', 'assets/title-bg-4k.webp'];

function findEsbuild() {
  const candidates = [
    process.env.ESBUILD_BIN,
    path.join(ROOT, 'node_modules/.bin/esbuild'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    return execFileSync('which', ['esbuild'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

function writeWithCompressed(relPath, buf) {
  const outPath = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  const gz = zlib.gzipSync(buf, { level: 9 });
  const br = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
  fs.writeFileSync(outPath + '.gz', gz);
  fs.writeFileSync(outPath + '.br', br);
  return { raw: buf.length, gz: gz.length, br: br.length };
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const esbuild = findEsbuild();
let jsBundle = '';
for (const f of JS_FILES) {
  const full = path.join(ROOT, f);
  if (esbuild) {
    jsBundle += execFileSync(esbuild, [full, '--minify', '--target=es2022']).toString();
  } else {
    jsBundle += fs.readFileSync(full, 'utf8') + '\n';
  }
}

const cssFull = path.join(ROOT, 'style.css');
const cssBundle = esbuild
  ? execFileSync(esbuild, [cssFull, '--minify']).toString()
  : fs.readFileSync(cssFull, 'utf8');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(
  /<script defer src="src\/audio\.js"><\/script>\s*<script defer src="src\/space\.js"><\/script>\s*<script defer src="src\/titleScene\.js"><\/script>\s*<script defer src="src\/powerupIcons\.js"><\/script>\s*<script defer src="src\/ships\.js"><\/script>\s*<script defer src="src\/renderer\.js"><\/script>\s*<script defer src="src\/game\.js"><\/script>/,
  '<script defer src="bundle.js"></script>'
);

const stats = {
  'index.html': writeWithCompressed('index.html', Buffer.from(html)),
  'style.css': writeWithCompressed('style.css', Buffer.from(cssBundle)),
  'bundle.js': writeWithCompressed('bundle.js', Buffer.from(jsBundle)),
};

let fontBytes = 0;
for (const f of FONT_FILES) {
  const buf = fs.readFileSync(path.join(ROOT, f));
  const out = path.join(DIST, f);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  fontBytes += buf.length;
}

let assetBytes = 0;
for (const f of ASSET_FILES) {
  const srcPath = path.join(ROOT, f);
  if (!fs.existsSync(srcPath)) continue;
  const buf = fs.readFileSync(srcPath);
  const out = path.join(DIST, f);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  assetBytes += buf.length;
}

const totalBrCode = stats['index.html'].br + stats['style.css'].br + stats['bundle.js'].br;
const totalGzCode = stats['index.html'].gz + stats['style.css'].gz + stats['bundle.js'].gz;
const totalRawCode = stats['index.html'].raw + stats['style.css'].raw + stats['bundle.js'].raw;

console.log(`Build complete (${esbuild ? 'minified via esbuild' : 'unminified raw'}):`);
console.table(stats);
console.log(`Code Total  -> raw: ${(totalRawCode / 1024).toFixed(2)} KB | gzip: ${(totalGzCode / 1024).toFixed(2)} KB | brotli: ${(totalBrCode / 1024).toFixed(2)} KB`);
console.log(`Fonts Total -> ${(fontBytes / 1024).toFixed(2)} KB (already WOFF2 compressed)`);
console.log(`Media Total -> ${(assetBytes / 1024).toFixed(2)} KB (adaptive 1080p/4K WebP; client fetches 1 resolution only)`);
console.log(`Core Total  -> ${((totalBrCode + fontBytes) / 1024).toFixed(2)} KB Brotli-11 (0 external network requests)`);
