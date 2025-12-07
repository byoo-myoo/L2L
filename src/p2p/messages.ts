import type { PairResultPayload, UserAnswers } from '../domain/types';

export type P2PMessage =
    | { kind: 'ANSWER_SUMMARY'; payload: UserAnswers }
    | { kind: 'PAIR_RESULT'; payload: number }
    | { kind: 'PAIR_RESULT_PAYLOAD'; payload: { A: PairResultPayload; B: PairResultPayload } };

export function isP2PMessage(data: unknown): data is P2PMessage {
    if (typeof data !== 'object' || data === null) return false;
    const base = data as { kind?: unknown; payload?: unknown };
    switch (base.kind) {
        case 'ANSWER_SUMMARY':
            return typeof base.payload === 'object' && base.payload !== null;
        case 'PAIR_RESULT':
            return typeof base.payload === 'number';
        case 'PAIR_RESULT_PAYLOAD':
            return (
                typeof base.payload === 'object' &&
                base.payload !== null &&
                'A' in base.payload &&
                'B' in base.payload
            );
        default:
            return false;
    }
}
