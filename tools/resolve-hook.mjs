/**
 * Two small accommodations so Node's built-in test runner can execute the same
 * source Metro does, with nothing installed:
 *
 *  1. Extensionless relative imports ("./deal" rather than "./deal.ts").
 *  2. Bare JSON imports. Node requires `with { type: 'json' }`; Metro and
 *     TypeScript's resolveJsonModule do not. Rather than litter the source
 *     with import attributes Metro doesn't need, the attribute is added here.
 */
const HAS_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|node)$/;

export async function resolve(specifier, context, nextResolve) {
  let result;

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !HAS_EXT.test(specifier)) {
    for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      try {
        result = await nextResolve(specifier + suffix, context);
        break;
      } catch {
        /* try the next candidate */
      }
    }
  }

  result ??= await nextResolve(specifier, context);

  if (result.url.endsWith('.json')) {
    result.format = 'json';
    result.importAttributes = { ...result.importAttributes, type: 'json' };
  }
  return result;
}
