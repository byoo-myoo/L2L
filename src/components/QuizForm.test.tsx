import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizForm from "./QuizForm";

const renderOwnerQuiz = (onComplete = vi.fn()) =>
    render(<QuizForm role="owner" headline="test" onComplete={onComplete} />);

const clickFirstHeartPerQuestionBlock = (container: HTMLElement) => {
    const blocks = Array.from(container.querySelectorAll('.question-block'));
    blocks.forEach((block) => {
        const firstHeart = block.querySelector('button[aria-label$="1 / 5"]');
        if (firstHeart) {
            fireEvent.click(firstHeart);
        }
    });
};

describe("QuizForm", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("initially shows 10 shuffled questions with heart scale", () => {
        const { container } = renderOwnerQuiz();

        const questions = screen.getAllByText(/Q\d+/);
        expect(questions.length).toBe(10);

        const hearts = container.querySelectorAll('button[aria-label*="/ 5"]');
        expect(hearts.length).toBeGreaterThan(0);
    });

    it(
        "enables submit after answering base 10 and followup 5",
        async () => {
        const onComplete = vi.fn();
        const { container } = renderOwnerQuiz(onComplete);

        // answer base 10
        clickFirstHeartPerQuestionBlock(container);

        // proceed to followups
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "次へ" })).not.toBeDisabled();
        });
        await userEvent.click(screen.getByRole("button", { name: "次へ" }));

        await waitFor(() => {
            expect(screen.getByText("質問の続き")).toBeInTheDocument();
        });
        clickFirstHeartPerQuestionBlock(container);

        const submitBtn = screen.getByRole("button", { name: "診断結果へ" });
            expect(submitBtn).not.toBeDisabled();
            await userEvent.click(submitBtn);
            expect(onComplete).toHaveBeenCalled();
        },
        20000,
    );
});
