import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { getPeerOptions } from '../config/p2p';
import type { P2PMessage } from '../p2p/messages';
import { isP2PMessage } from '../p2p/messages';

export type P2PStatus = 'idle' | 'listening' | 'connecting' | 'retrying' | 'connected' | 'error';

export interface UseP2POptions<T extends P2PMessage = P2PMessage> {
    sessionId?: string;
    role?: 'owner' | 'guest';
    onMessage?: (data: T) => void;
    guard?: (data: unknown) => data is T;
    autoStart?: boolean;
    maxRetries?: number; // 0 or undefined -> unlimited
    retryDelayMs?: number;
}

export interface P2PState<T extends P2PMessage = P2PMessage> {
    peerId: string | null;
    status: P2PStatus;
    error: string | null;
    lastMessage: T | null;
    connect: (remotePeerId?: string) => void;
    send: (data: T) => void;
    disconnect: () => void;
    restart: () => void;
    retryCount: number;
}

export function useP2P<T extends P2PMessage = P2PMessage>(options: UseP2POptions<T> = {}): P2PState<T> {
    const {
        sessionId,
        role = 'owner',
        onMessage,
        guard = isP2PMessage as (data: unknown) => data is T,
        autoStart = true,
        maxRetries = 3,
        retryDelayMs = 2500,
    } = options;
    const [peerId, setPeerId] = useState<string | null>(null);
    const [status, setStatus] = useState<P2PStatus>(role === 'owner' ? 'listening' : 'idle');
    const [error, setError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<T | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [restartCount, setRestartCount] = useState(0); // Added for manual restart

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const onMessageRef = useRef(onMessage);
    const guardRef = useRef(guard);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        guardRef.current = guard;
    }, [guard]);

    const attachConnection = useCallback((conn: DataConnection) => {
        connRef.current = conn;

        conn.on('open', () => {
            setStatus('connected');
            setRetryCount(0);
        });

        conn.on('data', (receivedData) => {
            if (!guardRef.current(receivedData)) return;
            setLastMessage(receivedData);
            onMessageRef.current?.(receivedData);
        });

        conn.on('close', () => {
            setStatus('idle');
            connRef.current = null;
        });

        conn.on('error', (err) => {
            setError(err.message);
            setStatus('error');
        });
    }, []);

    useEffect(() => {
        if (!autoStart) return;
        const opts = getPeerOptions();
        const peer =
            role === 'owner' && sessionId
                ? new Peer(sessionId, opts)
                : opts
                    ? new Peer(opts)
                    : new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            setPeerId(id);
            setError(null);
        });

        peer.on('connection', (conn) => {
            if (role === 'owner') {
                attachConnection(conn);
            }
        });

        peer.on('error', (err) => {
            setError(err.message);
            setStatus('error');
        });

        return () => {
            peer.destroy();
        };
    }, [sessionId, role, autoStart, attachConnection, restartCount]); // Added restartCount

    const connect = useCallback(
        (remotePeerId?: string) => {
            if (!peerRef.current) {
                setError('Peer is not ready');
                setStatus('error');
                return;
            }
            const targetId = remotePeerId ?? sessionId;
            if (!targetId) {
                setError('Remote peer id missing');
                setStatus('error');
                return;
            }
            setStatus('connecting');
            const conn = peerRef.current.connect(targetId as string);
            attachConnection(conn);
        },
        [sessionId, attachConnection],
    );

    // guest: auto retry on error/idle
    useEffect(() => {
        if (role !== 'guest') return;
        if (!sessionId) return;
        if (status === 'connected' || status === 'connecting') return;
        const maxRetryEnabled = typeof maxRetries === 'number' && maxRetries > 0;
        if (maxRetryEnabled && retryCount >= maxRetries) return;

        const needsRetry = status === 'error' || status === 'idle' || status === 'retrying';
        if (!needsRetry) return;

        const t = setTimeout(() => {
            setRetryCount((c) => c + 1);
            setStatus('retrying');
            connect(sessionId);
        }, retryDelayMs);
        return () => clearTimeout(t);
    }, [status, role, sessionId, retryCount, maxRetries, retryDelayMs, connect]);

    const send = useCallback((data: T) => {
        if (connRef.current && status === 'connected') {
            connRef.current.send(data);
        }
    }, [status]);

    const disconnect = useCallback(() => {
        connRef.current?.close();
        peerRef.current?.destroy();
        setStatus('idle');
    }, []);

    const restart = useCallback(() => {
        setRestartCount((prev) => prev + 1);
        setStatus(role === 'owner' ? 'listening' : 'idle');
        setError(null);
        setRetryCount(0);
    }, [role]);

    return {
        peerId,
        status,
        error,
        lastMessage,
        connect,
        send,
        disconnect,
        restart,
        retryCount,
    };
}
