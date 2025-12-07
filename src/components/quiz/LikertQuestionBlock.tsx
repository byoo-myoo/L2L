import React from 'react';
import { type Question } from '../../domain/types';
import HeartScale from './HeartScale';

interface LikertQuestionBlockProps {
    question: Question;
    displayIndex: number;
    selected: number;
    onSelect: (value: number) => void;
}

const LikertQuestionBlock: React.FC<LikertQuestionBlockProps> = ({
    question,
    displayIndex,
    selected,
    onSelect,
}) => {
    const minLabel = question.options[0].text;
    const maxLabel = question.options[question.options.length - 1].text;

    return (
        <div id={`q-block-${question.id}`} className="question-block">
            <p className="eyebrow">Q{displayIndex}</p>
            <h2>{question.text}</h2>
            <div className="likert-block" role="group" aria-label={question.text}>
                <div className="likert-label-row">
                    <span className="likert-label">{minLabel}</span>
                    <span className="likert-label right">{maxLabel}</span>
                </div>
                <HeartScale value={selected || null} onChange={onSelect} />
            </div>
        </div>
    );
};

export default LikertQuestionBlock;
