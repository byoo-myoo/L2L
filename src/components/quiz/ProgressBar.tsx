import React from 'react';

interface Props {
    progress: number;
    label?: string;
}

const ProgressBar: React.FC<Props> = ({ progress, label }) => (
    <div className="progress">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
        {label && <span className="progress-label">{label}</span>}
    </div>
);

export default ProgressBar;
