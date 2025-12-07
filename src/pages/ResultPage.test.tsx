import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResultPage from "./ResultPage";
import { AppStatusProvider } from "../context/AppStatusContext";
import { decodePayload } from "../utils/urlState";

// Mock dependencies
vi.mock("../utils/urlState", () => ({
    decodePayload: vi.fn(),
}));

vi.mock("react-router-dom", async (orig) => {
    const actual = await orig();
    const base = actual as Record<string, unknown>;
    return {
        ...base,
        useSearchParams: vi.fn(() => [new URLSearchParams("d=bad")]),
        useNavigate: () => vi.fn(),
    };
});

describe("ResultPage", () => {
    it("shows error message when payload is invalid", () => {
        vi.mocked(decodePayload).mockReturnValue({ ok: false, error: new Error("decode failed") });

        render(
            <AppStatusProvider>
                <MemoryRouter>
                    <ResultPage />
                </MemoryRouter>
            </AppStatusProvider>
        );

        expect(screen.getByText(/結果データが見つかりませんでした/)).toBeInTheDocument();
    });

    it("shows personal and pair result cards when payload is valid", () => {
        const validPayload = {
            v: 1,
            sid: "sid-123",
            view: "A",
            resultId: 1012,
            highlight: {
                question: "Highlight Q",
                myAnswer: 1,
                partnerAnswer: 2,
            },
            bonusDetail: {
                question: "Bonus Q",
                ownerAnswer: 1,
                partnerAnswer: 1,
            },
            answers: {
                self: { 1: 1 },
                partner: { 1: 2 },
            },
        };

        vi.mocked(decodePayload).mockReturnValue({ ok: true, value: validPayload } as any);

        render(
            <AppStatusProvider>
                <MemoryRouter>
                    <ResultPage />
                </MemoryRouter>
            </AppStatusProvider>
        );

        expect(screen.getByText(/SOLO STYLE/i)).toBeInTheDocument();
        expect(screen.getByText(/DUO:/i)).toBeInTheDocument();

        expect(screen.getAllByText("二人の答えた質問チェック").length).toBeGreaterThan(0);
        const [button] = screen.getAllByRole("button", { name: /週末のデート/ });
        fireEvent.click(button);
        expect(screen.getByRole("heading", { name: /週末のデート/ })).toBeInTheDocument();

        expect(screen.getByText("追加質問（あなたが設定！）")).toBeInTheDocument();
        expect(screen.getByText("Bonus Q")).toBeInTheDocument();
    });
});
