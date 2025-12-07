import React from 'react';
import HeartScale from './HeartScale';

interface Props {
    id?: string;
    displayIndex: number;
    questionText: string;
    ariaLabel?: string;
    scaleMin: string;
    scaleMax: string;
    value: number | null;
    onSelect: (v: number) => void;
}

const BonusQuestionGuest: React.FC<Props> = ({
    id,
    displayIndex,
    questionText,
    ariaLabel,
    scaleMin,
    scaleMax,
    value,
    onSelect,
}) => (
    <div id={id} className="question-block">
        <p className="eyebrow">Q{displayIndex}</p>
        <h2>{questionText}</h2>
        <div className="likert-block" role="group" aria-label={questionText}>
            <div className="likert-label-row">
                <span className="likert-label">{scaleMin || '左'}</span>
                <span className="likert-label right">{scaleMax || '右'}</span>
            </div>
            <HeartScale value={value} onChange={onSelect} ariaLabel={ariaLabel || questionText} />
        </div>

    </div>
);

export default BonusQuestionGuest;
