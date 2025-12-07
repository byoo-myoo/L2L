import React from 'react';
import HeartScale from '../quiz/HeartScale';

export interface HighlightChoice {
    id: string;
    label: string;
    text: string;
    my: number | null | undefined;
    partner: number | null | undefined;
}

interface Props {
    choices: HighlightChoice[];
    selectedId: string | null;
    locked: boolean;
    onSelect: (id: string) => void;
}

const HighlightSelector: React.FC<Props> = ({ choices, selectedId, locked, onSelect }) => {
    const selected = choices.find((c) => c.id === selectedId) ?? null;
    return (
        <section className="card">
            <p className="eyebrow">二人の答えを1問チェック</p>
            <p className="hint">気になる質問を1回だけタップして相手の答えを確認できます。</p>
            <div className="chip-list">
                {choices.map((c, idx) => (
                    <button
                        key={`${c.id}-${idx}`}
                        type="button"
                        className={`chip ${selectedId === c.id ? 'selected' : ''}`}
                        onClick={() => {
                            if (locked) return;
                            onSelect(c.id);
                        }}
                        disabled={locked && selectedId !== c.id}
                    >
                        {c.label}: {c.text}
                    </button>
                ))}
            </div>
            {selected && (
                <>
                    <h3>{selected.text}</h3>
                    <div className="likert-block readonly">
                        <p className="hint">あなた</p>
                        <HeartScale value={selected.my ?? null} readOnly />
                        <p className="hint">相手</p>
                        <HeartScale value={selected.partner ?? null} readOnly />
                    </div>
                    {locked && <p className="hint">※ 選び直しはできません</p>}
                </>
            )}
        </section>
    );
};

export default HighlightSelector;
