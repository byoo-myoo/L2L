import React, { useMemo, useState } from 'react';
import { pickFollowupQuestions, shuffleBaseQuestions } from '../domain/questions';
import type { Role, UserAnswers, Question } from '../domain/types';
import HeartScale from './quiz/HeartScale';
import BonusQuestionEditor from './quiz/BonusQuestionEditor';
import ProgressBar from './quiz/ProgressBar';
import LikertQuestionBlock from './quiz/LikertQuestionBlock';
import { calculateScoreVector } from '../domain/scoring';

interface QuizFormProps {
    role: Role;
    headline?: string;
    onComplete: (answers: UserAnswers) => void;
    bonusQuestionText?: string;
    onBonusQuestionChange?: (text: string) => void;
    bonusLabelText?: string; // kept for compatibility (mirrors question text)
    onBonusLabelChange?: (text: string) => void;
    bonusScaleMinText?: string;
    bonusScaleMaxText?: string;
    onBonusScaleMinChange?: (text: string) => void;
    onBonusScaleMaxChange?: (text: string) => void;
}

const QuizForm: React.FC<QuizFormProps> = ({
    role,
    headline,
    onComplete,
    bonusQuestionText = '',
    onBonusQuestionChange,
    bonusLabelText = '',
    onBonusLabelChange,
    bonusScaleMinText = 'まったり',
    bonusScaleMaxText = 'しっかり',
    onBonusScaleMinChange,
    onBonusScaleMaxChange,
}: QuizFormProps) => {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [followups, setFollowups] = useState<Question[]>([]);
    const [step, setStep] = useState<'base' | 'followup'>('base');
    const [bonusAnswer, setBonusAnswer] = useState<number | null>(null);

    const baseQuestions = useMemo(() => shuffleBaseQuestions(), []);

    const hasBonusText = bonusQuestionText.trim().length > 0;
    const guestHasBonus = role === 'guest' && hasBonusText;
    const bonusAriaLabel = bonusLabelText.trim() || bonusQuestionText;

    const baseAnsweredCount = baseQuestions.filter((q) => answers[q.id] !== undefined).length;
    const baseAnsweredAll = baseAnsweredCount === baseQuestions.length;
    const followupsAnsweredCount =
        followups.filter((q) => answers[q.id] !== undefined).length + (hasBonusText && bonusAnswer !== null ? 1 : 0);
    const followupsReady = followups.length > 0;
    const canPrepareFollowups = baseAnsweredAll && !followupsReady;
    const followupCountWithBonus = followups.length + (hasBonusText ? 1 : 0);

    const totalQuestions =
        step === 'base' ? baseQuestions.length : baseQuestions.length + followupCountWithBonus;
    const answeredQuestions =
        step === 'base' ? baseAnsweredCount : baseAnsweredCount + followupsAnsweredCount;
    const progress = Math.min((answeredQuestions / totalQuestions) * 100, 100);

    const followupsAnsweredAll = followupsReady && followups.every((q) => answers[q.id] !== undefined);

    const canProceed = step === 'base' && baseAnsweredAll;
    const canSubmit =
        step === 'followup' &&
        baseAnsweredAll &&
        followupsReady &&
        followupsAnsweredAll &&
        (!guestHasBonus || bonusAnswer !== null);

    const canSubmitGuest = canSubmit;
    const canSubmitOwner = canSubmit; // オーナーの追加質問は編集のみ

    // 先行して深掘り5問を準備（表示は「次へ」以降）
    React.useEffect(() => {
        if (!canPrepareFollowups) return;
        const baseOnly: Record<number, number> = {};
        baseQuestions.forEach((q) => {
            const val = answers[q.id];
            if (val !== undefined) baseOnly[q.id] = val;
        });
        const scoreVec = calculateScoreVector(baseOnly);
        setFollowups(pickFollowupQuestions(scoreVec, 5));
    }, [canPrepareFollowups, baseQuestions, answers]);

    // renderLikertQuestion function removed.

    type FollowupBlock = { kind: 'followup'; question: Question } | { kind: 'bonus' };

    const shuffledFollowupBlocks: FollowupBlock[] = useMemo(() => {
        if (step !== 'followup') return [];
        const items: FollowupBlock[] = [
            ...followups.map((q) => ({ kind: 'followup' as const, question: q })),
            ...(hasBonusText ? [{ kind: 'bonus' as const }] : []),
        ];
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, [followups, hasBonusText, step]);

    const handleOptionSelect = (questionId: number, value: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleProceedToFollowup = () => {
        if (!baseAnsweredAll) return;
        if (!followupsReady) {
            const baseOnly: Record<number, number> = {};
            baseQuestions.forEach((q) => {
                const val = answers[q.id];
                if (val !== undefined) baseOnly[q.id] = val;
            });
            const scoreVec = calculateScoreVector(baseOnly);
            setFollowups(pickFollowupQuestions(scoreVec, 5));
        }
        setStep('followup');
    };

    const handleSubmit = () => {
        const canSubmit = role === 'owner' ? canSubmitOwner : canSubmitGuest;
        if (!canSubmit) return;
        const userAnswers: UserAnswers = {
            answers,
            bonusAnswerValue: hasBonusText ? bonusAnswer : null,
        };
        onComplete(userAnswers);
    };

    React.useEffect(() => {
        if (step !== 'followup') return;
        if (typeof window === 'undefined') return;
        const ua = window.navigator?.userAgent || '';
        if (/jsdom/i.test(ua)) return;

        const firstBlock = shuffledFollowupBlocks[0];
        const targetId =
            firstBlock?.kind === 'bonus'
                ? 'q-block-bonus'
                : firstBlock?.kind === 'followup'
                    ? `q-block-${firstBlock.question.id}`
                    : null;

        const target =
            (targetId ? document.getElementById(targetId) : null) ??
            (document.querySelector('.quiz-form') as HTMLElement | null);

        if (target?.scrollIntoView) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step, shuffledFollowupBlocks]);

    return (
        <div className="quiz-form">
            {headline && <h1 className="page-title">{headline}</h1>}

            <ProgressBar progress={progress} label={`${answeredQuestions}/${totalQuestions}`} />

            {step === 'base' && (
                <section className="card">
                    <p className="eyebrow">最初の10問</p>
                    {baseQuestions.map((q, idx) => (
                        <LikertQuestionBlock
                            key={q.id}
                            question={q}
                            displayIndex={idx + 1}
                            selected={answers[q.id] ?? 0}
                            onSelect={(v) => handleOptionSelect(q.id, v)}
                        />
                    ))}
                </section>
            )}

            {step === 'followup' && (
                <>
                    <section className="card">
                        <p className="eyebrow">質問の続き</p>
                        {shuffledFollowupBlocks.map((item, idx) => {
                            const displayIndex = baseQuestions.length + idx + 1;
                            if (item.kind === 'bonus') {
                                const selected = bonusAnswer ?? 0;
                                return (
                                    <div key="bonus-block" id="q-block-bonus" className="question-block">
                                        <p className="eyebrow">Q{displayIndex}</p>
                                        <h2>{bonusQuestionText || '追加質問'}</h2>
                                        <div className="likert-block" role="group" aria-label={bonusAriaLabel || '追加質問'}>
                                            <div className="likert-label-row">
                                                <span className="likert-label">{bonusScaleMinText}</span>
                                                <span className="likert-label right">{bonusScaleMaxText}</span>
                                            </div>
                                            <HeartScale value={selected || null} onChange={(v) => setBonusAnswer(v)} />
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <LikertQuestionBlock
                                    key={item.question.id}
                                    question={item.question}
                                    displayIndex={displayIndex}
                                    selected={answers[item.question.id] ?? 0}
                                    onSelect={(v) => handleOptionSelect(item.question.id, v)}
                                />
                            );
                        })}
                    </section>

                    {role === 'owner' && (
                        <BonusQuestionEditor
                            questionText={bonusQuestionText}
                            onQuestionChange={(text) => {
                                onBonusQuestionChange?.(text);
                                onBonusLabelChange?.(text); // compatibility
                            }}
                            scaleMin={bonusScaleMinText}
                            scaleMax={bonusScaleMaxText}
                            onScaleMinChange={(text) => onBonusScaleMinChange?.(text)}
                            onScaleMaxChange={(text) => onBonusScaleMaxChange?.(text)}
                            value={bonusAnswer}
                            onSelect={setBonusAnswer}
                            hasQuestion={hasBonusText}
                        />
                    )}
                </>
            )}

            <div className="cta-row">
                {step === 'base' ? (
                    <button className="btn primary" disabled={!canProceed} onClick={handleProceedToFollowup}>
                        次へ
                    </button>
                ) : role === 'owner' ? (
                    <button className="btn primary" disabled={!canSubmitOwner} onClick={handleSubmit}>
                        診断結果へ
                    </button>
                ) : (
                    <button className="btn primary" disabled={!canSubmitGuest} onClick={handleSubmit}>
                        送信する
                    </button>
                )}
            </div>

            <p className="role-note">
                モード: <strong>{role === 'owner' ? 'あなた（招待する側）' : '相手（招待された側）'}</strong>
            </p>
        </div>
    );
};

export default QuizForm;
