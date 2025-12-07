import React from 'react';
import HeartScale from '../quiz/HeartScale';

interface Props {
    heading?: string;
    question: string;
    label?: string;
    minLabel?: string;
    maxLabel?: string;
    myAnswer: number | null;
    partnerAnswer: number | null;
}

const BonusAnswerBlock: React.FC<Props> = ({
    heading = '追加質問（あなたが設定！）',
    question,
    label,
    minLabel,
    maxLabel,
    myAnswer,
    partnerAnswer,
}) => (
    <section className="card">
        <p className="eyebrow">{heading}</p>
        <h3>{question}</h3>
        {label && (
            <p className="hint">
                スケール: {minLabel ?? '左'} ↔ {maxLabel ?? '右'} ｜ ラベル: {label}
            </p>
        )}
        <div className="likert-block readonly">
            <p className="hint">あなた</p>
            <HeartScale value={myAnswer} readOnly />
            <p className="hint">相手</p>
            <HeartScale value={partnerAnswer} readOnly />
        </div>
    </section>
);

export default BonusAnswerBlock;
