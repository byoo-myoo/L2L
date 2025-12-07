import React from 'react';

interface HeartScaleProps {
    value: number | null;
    onChange?: (val: number) => void;
    readOnly?: boolean;
    ariaLabel?: string;
}

const HeartScale: React.FC<HeartScaleProps> = ({ value, onChange, readOnly = false, ariaLabel }) => (
    <div className={`likert-hearts${readOnly ? ' readonly' : ''}`}>
        {[1, 2, 3, 4, 5].map((v) => {
            const label = ariaLabel ? `${ariaLabel}: ${v} / 5` : `${v} / 5`;
            const common = {
                className: `heart ${value === v ? 'selected' : ''}`,
                'data-tone': v,
                'aria-pressed': value === v,
                'aria-label': label,
                children: '\u2665',
            };
            return readOnly ? (
                <span key={v} aria-hidden {...common} />
            ) : (
                <button
                    key={v}
                    type="button"
                    {...common}
                    onClick={() => onChange?.(v)}
                />
            );
        })}
    </div>
);

export default HeartScale;
