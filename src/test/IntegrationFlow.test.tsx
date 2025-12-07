import React, { useEffect } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, act, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvitePage from '../pages/InvitePage';
import ResultPage from '../pages/ResultPage';
import { encodePayload } from '../utils/urlState';
import type { InvitePayload, PairResultPayload, UserAnswers } from '../domain/types';
import type { P2PMessage } from '../p2p/messages';
import { AppStatusProvider } from '../context/AppStatusContext';
import { calculatePairResult } from '../domain/scoring';
import { QUESTIONS } from '../domain/questions';

type Endpoint = {
    role: 'owner' | 'guest';
    sessionId?: string;
    onMessage?: (msg: P2PMessage) => void;
    setStatus: (s: string) => void;
};

class Bridge {
    private endpoints = new Map<string, { owner?: Endpoint; guest?: Endpoint }>();

    register(ep: Endpoint) {
        const key = ep.sessionId ?? 'sid';
        const entry = this.endpoints.get(key) ?? {};
        entry[ep.role] = ep;
        this.endpoints.set(key, entry);
        this.tryConnect(key);
        return () => {
            const e = this.endpoints.get(key);
            if (!e) return;
            e[ep.role] = undefined;
        };
    }

    send(key: string, from: 'owner' | 'guest', msg: P2PMessage) {
        const entry = this.endpoints.get(key);
        if (!entry) return;
        const target = from === 'owner' ? entry.guest : entry.owner;
        target?.onMessage?.(msg);
    }

    private tryConnect(key: string) {
        const entry = this.endpoints.get(key);
        if (entry?.owner && entry.guest) {
            entry.owner.setStatus('connected');
            entry.guest.setStatus('connected');
        }
    }
}

const bridge = new Bridge();

vi.mock('../hooks/useP2P', () => {
    return {
        useP2P: (opts: any) => {
            const { useState, useEffect } = React as typeof import('react');
            const [status, setStatus] = useState(opts.role === 'owner' ? 'listening' : 'idle');
            const [lastMessage, setLastMessage] = useState<P2PMessage | null>(null);
            useEffect(() => {
                const unregister = bridge.register({
                    role: opts.role ?? 'owner',
                    sessionId: opts.sessionId,
                    onMessage: (msg) => {
                        setLastMessage(msg);
                        opts.onMessage?.(msg);
                    },
                    setStatus,
                });
                return unregister;
            }, [opts.sessionId, opts.role, opts.onMessage]);

            const connect = () => {
                setStatus('connecting');
                bridge.send(opts.sessionId ?? 'sid', opts.role ?? 'owner', { kind: 'PING' } as unknown as P2PMessage);
            };
            const send = (data: P2PMessage) => bridge.send(opts.sessionId ?? 'sid', opts.role ?? 'owner', data);
            const disconnect = () => setStatus('idle');
            return { peerId: `${opts.role}-peer`, status, error: null, lastMessage, connect, send, disconnect, retryCount: 0 };
        },
    };
});

// QuizForm をモック: レンダーされたら即 onComplete を呼ぶ
const mockOwnerAnswers: UserAnswers = {
    answers: Object.fromEntries(QUESTIONS.map((q) => [q.id, 1])),
    bonusAnswerValue: 1,
};
const mockGuestAnswers: UserAnswers = { ...mockOwnerAnswers };

vi.mock('../components/QuizForm', () => ({
    default: (props: any) => {
        useEffect(() => {
            props.onComplete(props.role === 'owner' ? mockOwnerAnswers : mockGuestAnswers);
        }, [props]);
        return <div data-testid={`quiz-${props.role}`} />;
    },
}));

const renderInvite = (initialEntry: { pathname: string; search: string; state?: unknown }) =>
    render(
        <AppStatusProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/invite" element={<InvitePage />} />
                </Routes>
            </MemoryRouter>
        </AppStatusProvider>,
    );

const renderResultPage = (payload: PairResultPayload) =>
    render(
        <AppStatusProvider>
            <MemoryRouter initialEntries={[`/result?d=${encodePayload(payload)}`]}>
                <Routes>
                    <Route path="/result" element={<ResultPage />} />
                </Routes>
            </MemoryRouter>
        </AppStatusProvider>,
    );

describe('Host/Guest full flow (mocked P2P)', () => {
    it(
        '両者の招待ページで結果カード・1問チェック・ホスト追加質問が表示される',
        async () => {
            const sid = 'test-session';
            const invitePayload: InvitePayload = {
                v: 1,
                role: 'owner',
                sid,
                bonusQ: '追加質問本文',
                bonusLabel: '追加質問タイトル',
                bonusMin: 'まったり',
                bonusMax: 'しっかり',
            };
            const encoded = encodePayload(invitePayload);

            const pair = calculatePairResult(mockOwnerAnswers, mockGuestAnswers);
            const highlight = {
                question: QUESTIONS[0].text,
                myAnswer: 1,
                partnerAnswer: 1,
            };
            const payloads: { A: PairResultPayload; B: PairResultPayload } = {
                A: {
                    v: 1,
                    sid,
                    view: 'A',
                    resultId: pair.resultId,
                    highlight,
                    bonusDetail: {
                        question: invitePayload.bonusQ!,
                        label: invitePayload.bonusLabel,
                        minLabel: invitePayload.bonusMin,
                        maxLabel: invitePayload.bonusMax,
                        ownerAnswer: 1,
                        partnerAnswer: 1,
                    },
                    answers: { self: mockOwnerAnswers.answers, partner: mockGuestAnswers.answers },
                },
                B: {
                    v: 1,
                    sid,
                    view: 'B',
                    resultId: pair.resultId,
                    highlight,
                    bonusDetail: {
                        question: invitePayload.bonusQ!,
                        label: invitePayload.bonusLabel,
                        minLabel: invitePayload.bonusMin,
                        maxLabel: invitePayload.bonusMax,
                        ownerAnswer: 1,
                        partnerAnswer: 1,
                    },
                    answers: { self: mockGuestAnswers.answers, partner: mockOwnerAnswers.answers },
                },
            };

            const hostInvite = renderInvite({
                pathname: '/invite',
                search: `?d=${encoded}`,
                state: { ownerAnswers: mockOwnerAnswers, bonusQuestionText: '追加質問本文', bonusLabelText: '追加質問タイトル' },
            });
            const guestInvite = renderInvite({ pathname: '/invite', search: `?d=${encoded}` });

            // 双方の回答と結果ペイロードを送る（モックP2P経由）
            await act(async () => {
                bridge.send(sid, 'guest', { kind: 'ANSWER_SUMMARY', payload: mockOwnerAnswers } as unknown as P2PMessage);
                bridge.send(sid, 'owner', { kind: 'ANSWER_SUMMARY', payload: mockGuestAnswers } as unknown as P2PMessage);
                bridge.send(sid, 'owner', { kind: 'PAIR_RESULT_PAYLOAD', payload: payloads } as unknown as P2PMessage);
                bridge.send(sid, 'guest', { kind: 'PAIR_RESULT_PAYLOAD', payload: payloads } as unknown as P2PMessage);
            });

            await waitFor(() => {
                expect(hostInvite.getAllByText('二人用結果が解放されました').length).toBeGreaterThan(0);
                expect(guestInvite.getAllByText('二人用結果が解放されました').length).toBeGreaterThan(0);
            });

            // 結果ページでの表示を確認
            const hostResult = renderResultPage(payloads.A);
            const guestResult = renderResultPage(payloads.B);

            expect(within(hostResult.container).getAllByText('二人の答えた質問チェック').length).toBeGreaterThan(0);
            expect(within(hostResult.container).getByText('追加質問（あなたが設定！）')).toBeInTheDocument();

            expect(within(guestResult.container).getAllByText('二人の答えた質問チェック').length).toBeGreaterThan(0);
            expect(within(guestResult.container).queryByText('追加質問（あなたが設定！）')).toBeNull();

            hostInvite.unmount();
            guestInvite.unmount();
            hostResult.unmount();
            guestResult.unmount();
        },
        8000,
    );
});
