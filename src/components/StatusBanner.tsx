import { useAppStatus } from '../context/AppStatusContext';

const toneClass: Record<'info' | 'error' | 'success', string> = {
    info: 'banner-info',
    error: 'banner-error',
    success: 'banner-success',
};

const StatusBanner = () => {
    const { banner, clear } = useAppStatus();
    if (!banner) return null;

    return (
        <div className={`status-banner ${toneClass[banner.tone]}`}>
            <span>{banner.text}</span>
            <button className="banner-close" aria-label="閉じる" onClick={clear}>
                ×
            </button>
        </div>
    );
};

export default StatusBanner;
