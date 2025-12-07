import { describe, it, expect } from 'vitest';
import { encodePayload, decodePayload } from './urlState';
import type { InvitePayload } from '../domain/types';

describe('urlState', () => {
    it('should encode and decode invite payload correctly', () => {
        const payload: InvitePayload = {
            v: 1,
            role: 'owner',
            sid: 'test-session-id',
            keyQ: 101,
            keyA: 1,
            typeHint: 2
        };

        const encoded = encodePayload(payload);
        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodePayload<InvitePayload>(encoded);
        expect(decoded.ok).toBe(true);
        if (decoded.ok) {
            expect(decoded.value).toEqual(payload);
        }
    });

    it('should return null for invalid payload', () => {
        const decoded = decodePayload<InvitePayload>('invalid-string');
        expect(decoded.ok).toBe(false);
    });
});
