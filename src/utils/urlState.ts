import LZString from 'lz-string';
import type { Result } from './result';
import { err, ok } from './result';

export function encodePayload<T>(payload: T): string {
    const json = JSON.stringify(payload);
    return LZString.compressToEncodedURIComponent(json);
}

export function decodePayload<T>(encoded: string): Result<T, Error> {
    try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) {
            return err(new Error('Empty payload'));
        }
        return ok(JSON.parse(json) as T);
    } catch (e) {
        return err(e as Error);
    }
}
