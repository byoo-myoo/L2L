// Vitest env lacks Node types in this project; allow require for CJS shims.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

import '@testing-library/jest-dom';

// jsdom expects parse5 to expose serializeOuter; the pinned CJS build lacks it, so shim it for error paths
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const req: any = (globalThis as any).require ?? require;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parse5 = req('parse5');
    if (typeof parse5.serializeOuter !== 'function' && typeof parse5.serialize === 'function') {
        parse5.serializeOuter = parse5.serialize;
    }
    // jsdom imports from the dist bundle directly; patch that as well
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const dist = req('parse5/dist/index.js');
        if (typeof dist.serializeOuter !== 'function' && typeof dist.serialize === 'function') {
            dist.serializeOuter = dist.serialize;
        }
    } catch {
        // ignore if dist path is unavailable
    }
} catch {
    // ignore if parse5 cannot be loaded; tests will surface any downstream issues
}
