import { describe, it, expect } from 'vitest';
import { calculatePersonalResult, calculatePairResult, decodeResultId, buildPairViewFromResult } from './scoring';
import type { UserAnswers } from './types';

describe('scoring', () => {
    describe('calculatePersonalResult', () => {
        it('picks スキンシップ型 when affection is high', () => {
            const answers: UserAnswers = {
                answers: {
                    6: 1, // affection +2, initiative +1
                    10: 2, // affection +2
                },
                keyQuestionId: 101,
                keyAnswerValue: 1,
            };

            const result = calculatePersonalResult(answers);
            expect(result.typeId).toBe(4);
            expect(result.type.name).toBe('スキンシップ型');
            expect(result.score.affection).toBeGreaterThan(0);
        });
    });

    describe('calculatePairResult', () => {
        const baseA: UserAnswers = {
            answers: { 1: 2, 6: 1 }, // initiative +1, affection +2 -> type 3 or 4
            keyQuestionId: 101,
            keyAnswerValue: 1,
        };
        const baseB: UserAnswers = {
            answers: { 1: 3, 2: 2 }, // distance +3 -> type 2
            keyQuestionId: 101,
            keyAnswerValue: 1,
        };

        it('encodes type combination and key match into resultId', () => {
            const result = calculatePairResult(baseA, baseB);
            const decoded = decodeResultId(result.resultId);
            expect(decoded.keyMatch).toBe(true);
            expect(decoded.typeA).toBe(result.typeA);
            expect(decoded.typeB).toBe(result.typeB);
        });

        it('builds asymmetric views for A/B', () => {
            const { resultId } = calculatePairResult(baseA, baseB);
            const viewA = buildPairViewFromResult(resultId, 'A');
            const viewB = buildPairViewFromResult(resultId, 'B');
            expect(viewA.message).not.toEqual(viewB.message);
            expect(viewA.tips.length).toBeGreaterThan(0);
        });
    });
});
