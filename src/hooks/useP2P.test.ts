import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import Peer from 'peerjs';
import { useP2P } from './useP2P';

type MockConn = {
    on: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
};
type MockPeer = {
    on: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
};

let mockPeer: MockPeer;
let mockConn: MockConn;

// Mock PeerJS (hoist-safe: factory captures mutable refs)
vi.mock('peerjs', () => ({
    default: vi.fn(function PeerCtor(this: unknown) {
        return mockPeer;
    }),
}));

describe('useP2P', () => {

    beforeEach(() => {
        mockConn = {
            on: vi.fn(),
            send: vi.fn(),
            close: vi.fn(),
        };

        mockPeer = {
            on: vi.fn(),
            connect: vi.fn(() => mockConn),
            destroy: vi.fn(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const PeerMock = Peer as unknown as MockInstance;

    it('creates peer with provided sessionId when owner', () => {
        renderHook(() => useP2P({ sessionId: 'sid-123', role: 'owner' }));
        expect(PeerMock).toHaveBeenCalledWith('sid-123', expect.any(Object));
    });

    it('connects to remote peer when guest calls connect', () => {
        const { result } = renderHook(() => useP2P({ sessionId: 'remote-id', role: 'guest' }));

        act(() => result.current.connect());

        expect(mockPeer.connect).toHaveBeenCalledWith('remote-id');
    });

    it('invokes onMessage when data received', () => {
        const onMessage = vi.fn();
        const { result } = renderHook(() => useP2P({ sessionId: 'remote-id', role: 'guest', onMessage }));

        act(() => result.current.connect());

        // simulate connection and data
        act(() => {
            const conn = mockPeer.connect.mock.results[0]?.value || mockConn;
            const calls = conn.on.mock.calls as Array<[string, (...args: unknown[]) => void]>;
            const dataHandler = calls.find((call) => call[0] === 'data')?.[1];
            if (dataHandler) dataHandler({ kind: 'ANSWER_SUMMARY', payload: { answers: {}, keyAnswerValue: 0, keyQuestionId: 0 } });
        });

        expect(onMessage).toHaveBeenCalled();
    });
});
