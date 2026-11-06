// Node module-resolution hooks so app modules can be imported outside Next.js:
// `@/x` -> <repo>/src/x, extensionless and directory imports get .js / /index.js,
// and `server-only` becomes an empty module. Registered by run-cases.mjs.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const RETRY = new Set(['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT']);

export async function resolve(specifier, context, next) {
  if (specifier === 'server-only' || specifier === 'client-only') {
    return { url: 'data:text/javascript,export{}', shortCircuit: true };
  }
  if (specifier.startsWith('@/')) specifier = pathToFileURL(path.join(SRC, specifier.slice(2))).href;
  try {
    return await next(specifier, context);
  } catch (e) {
    if (!RETRY.has(e.code) || !/^(\.|\/|file:)/.test(specifier)) throw e;
    for (const suffix of ['.js', '.mjs', '/index.js']) {
      try { return await next(specifier + suffix, context); } catch { /* try next suffix */ }
    }
    throw e;
  }
}
