import React from 'react';
import HeartScale from './HeartScale';

interface Props {
    questionText: string;
    onQuestionChange: (text: string) => void;
    scaleMin: string;
    scaleMax: string;
    onScaleMinChange: (text: string) => void;
    onScaleMaxChange: (text: string) => void;
    value: number | null;
    onSelect: (v: number) => void;
    hasQuestion: boolean;
}

const BonusQuestionEditor: React.FC<Props> = ({
    questionText,
    onQuestionChange,
    scaleMin,
    scaleMax,
    onScaleMinChange,
    onScaleMaxChange,
    value,
    onSelect,
    hasQuestion,
}) => (
    <section className="card">
        <p className="eyebrow">追加質問（任意）</p>
        <>
            <label className="text-label">
                追加質問（相手に表示されます）
                <input
                    type="text"
                    className="text-input"
                    placeholder="例: どれくらいのペースで会いたい？"
                    value={questionText}
                    onChange={(e) => onQuestionChange(e.target.value)}
                />
            </label>
            <div className="scale-row">
                <label className="text-label">
                    左端ラベル
                    <input
                        type="text"
                        className="text-input"
                        placeholder="まったり"
                        value={scaleMin}
                        onChange={(e) => onScaleMinChange(e.target.value)}
                    />
                </label>
                <label className="text-label">
                    右端ラベル
                    <input
                        type="text"
                        className="text-input"
                        placeholder="しっかり"
                        value={scaleMax}
                        onChange={(e) => onScaleMaxChange(e.target.value)}
                    />
                </label>
            </div>
        </>
        {hasQuestion ? (
            <>
                <h3>{questionText || '追加質問'}</h3>
                <div className="likert-block">
                    <div className="likert-label-row">
                        <span className="likert-label">{scaleMin || 'LOW'}</span>
                        <span className="likert-label right">{scaleMax || 'HIGH'}</span>
                    </div>
                    <HeartScale value={value} onChange={onSelect} />
                </div>
            </>
        ) : (
            <p className="hint">追加質問が設定されていません</p>
        )}
    </section>
);

export default BonusQuestionEditor;
