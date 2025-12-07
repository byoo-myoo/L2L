import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import InvitePage from "./InvitePage";
import type { InvitePayload, UserAnswers } from "../domain/types";
import { AppStatusProvider } from "../context/AppStatusContext";
// @ts-expect-error __mock is injected by the vi.mock factory below
import { __mock as p2pMock } from "../hooks/useP2P";

const invitePayload: InvitePayload = {
    v: 1,
    role: "owner",
    sid: "sid-123",
};

const ownerAnswers: UserAnswers = {
    answers: {},
};

let locationState: Record<string, unknown> = { ownerAnswers };
let lastQuizOnComplete: ((answers: UserAnswers) => void) | null = null;

vi.mock("../utils/urlState", () => ({
    decodePayload: () => ({ ok: true, value: invitePayload }),
    encodePayload: () => "encoded",
}));

vi.mock("../hooks/useP2P", () => {
    const connectMock = vi.fn();
    const sendMock = vi.fn();
    let lastOnMessage: ((msg: any) => void) | undefined;
    const instance = {
        peerId: "sid-123",
        status: "connected" as string,
        error: null,
        lastMessage: null,
        connect: connectMock,
        send: sendMock,
        disconnect: vi.fn(),
        retryCount: 0,
    };
    return {
        useP2P: ({ onMessage }: { onMessage?: (msg: any) => void }) => {
            lastOnMessage = onMessage;
            return instance;
        },
        __mock: {
            connectMock,
            sendMock,
            getOnMessage: () => lastOnMessage,
            setStatus: (status: string) => {
                instance.status = status as typeof instance.status;
            },
        },
    };
});

vi.mock("../p2p/messages", async (orig) => {
    const actual = await orig(); const base = actual as Record<string, unknown>;
    return { ...base, isP2PMessage: () => true };
});

vi.mock("../utils/share", () => ({ copyToClipboard: vi.fn(), shareLink: vi.fn() }));

vi.mock("../components/QuizForm", () => ({
    __esModule: true,
    default: (props: any) => {
        lastQuizOnComplete = props.onComplete;
        return (
            <button
                type="button"
                data-testid="quiz-form"
                onClick={() =>
                    props.onComplete?.({
                        answers: {},
                        bonusAnswerValue: null,
                    })
                }
            >
                quiz
            </button>
        );
    },
}));

vi.mock("react-router-dom", async (orig) => {
    const actual = await orig(); const base = actual as Record<string, unknown>;
    return {
        ...base,
        useLocation: () => ({ state: locationState }),
        useSearchParams: () => [new URLSearchParams("d=dummy")],
    };
});

describe("InvitePage", () => {
    afterEach(() => {
        locationState = { ownerAnswers };
        lastQuizOnComplete = null;
        p2pMock.connectMock.mockClear();
        p2pMock.sendMock.mockClear();
    });

    const renderPage = () =>
        render(
            <AppStatusProvider>
                <MemoryRouter>
                    <InvitePage />
                </MemoryRouter>
            </AppStatusProvider>,
        );

    it("shows QR trigger and copy buttons", () => {
        renderPage();
        expect(screen.getByRole("button", { name: /QRコードを表示/ })).toBeInTheDocument();
        const copyButtons = screen.getAllByRole("button", { name: /リンクをコピー/ });
        expect(copyButtons.length).toBeGreaterThan(0);
    });



    it("shows result card when PAIR_RESULT_PAYLOAD is received", () => {
        renderPage();

        const payload = {
            A: { resultId: 1012, view: "A", answers: {}, highlight: { question: "Q", myAnswer: 1, partnerAnswer: 1 } },
            B: { resultId: 1012, view: "B", answers: {}, highlight: { question: "Q", myAnswer: 1, partnerAnswer: 1 } },
        };

        const capturedOnMessage = p2pMock.getOnMessage();
        expect(capturedOnMessage).toBeDefined();
        act(() => {
            capturedOnMessage?.({ kind: "PAIR_RESULT_PAYLOAD", payload });
        });

        expect(screen.getByText("二人用結果が解放されました")).toBeInTheDocument();
    });

    it("reconnects when guest finishes and submits answers", async () => {
        locationState = {}; // guest mode (no ownerAnswers)
        renderPage();

        await userEvent.click(screen.getByRole("button", { name: "診断を始める" }));

        expect(screen.getByTestId("quiz-form")).toBeInTheDocument();
        expect(lastQuizOnComplete).toBeInstanceOf(Function);

        p2pMock.connectMock.mockClear();

        act(() => {
            lastQuizOnComplete?.({
                answers: {},
                bonusAnswerValue: null,
            });
        });

        expect(p2pMock.connectMock).toHaveBeenCalledWith(invitePayload.sid);
    });
});
