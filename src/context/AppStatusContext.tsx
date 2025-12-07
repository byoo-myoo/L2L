import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

 type Tone = 'info' | 'error' | 'success';

export interface StatusMessage {
    id: number;
    tone: Tone;
    text: string;
}

interface AppStatusContextShape {
    banner: StatusMessage | null;
    pushMessage: (text: string, tone?: Tone) => void;
    clear: () => void;
}

const AppStatusContext = createContext<AppStatusContextShape | undefined>(undefined);

export const AppStatusProvider = ({ children }: { children: ReactNode }) => {
    const [banner, setBanner] = useState<StatusMessage | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const pushMessage = useCallback((text: string, tone: Tone = 'info') => {
        clearTimer();
        setBanner({ id: Date.now(), tone, text });
        timerRef.current = setTimeout(() => {
            setBanner(null);
            timerRef.current = null;
        }, 3000);
    }, []);

    const clear = useCallback(() => {
        clearTimer();
        setBanner(null);
    }, []);

    const value = useMemo(() => ({ banner, pushMessage, clear }), [banner, pushMessage, clear]);

    return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
};

export function useAppStatus() {
    const ctx = useContext(AppStatusContext);
    if (!ctx) throw new Error('useAppStatus must be used within AppStatusProvider');
    return ctx;
}
