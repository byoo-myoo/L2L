export interface Question {
    id: number;
    text: string;
    focus?: 'distance' | 'initiative' | 'security' | 'affection';
    options: {
        value: number;
        text: string;
        score: {
            distance?: number; // 距離感（近い・遠い）
            initiative?: number; // 主導性
            security?: number; // 安心感
            affection?: number; // 愛情表現
        };
    }[];
}

export interface KeyQuestion {
    id: number;
    text: string;
    options: {
        value: number;
        text: string;
    }[];
}

export interface InvitePayload {
    v: 1;
    role: "owner";
    sid: string;
    keyQ?: number;
    keyA?: number;
    typeHint?: number;
    bonusQ?: string;
    bonusLabel?: string;
    bonusMin?: string;
    bonusMax?: string;
}

export interface PairResultPayload {
    v: 1;
    sid: string;
    view: "A" | "B";
    resultId: number;
    duoVariant?: DuoVariant;
    soloVariantSelf?: SoloVariant;
    soloVariantPartner?: SoloVariant;
    soloAvatarSelf?: string;
    soloAvatarPartner?: string;
    highlight?: {
        question: string;
        myAnswer: number | null;
        partnerAnswer: number | null;
    };
    keyDetail?: {
        question: string;
        selfAnswer: number | null;
        partnerAnswer: number | null;
    };
    bonusDetail?: {
        question: string;
        label?: string;
        minLabel?: string;
        maxLabel?: string;
        ownerAnswer: number | null;
        partnerAnswer: number | null;
    };
    answers?: {
        self: Record<number, number>;
        partner: Record<number, number>;
    };
}

export type Role = "owner" | "guest";

export interface UserAnswers {
    answers: Record<number, number>; // questionId -> optionValue
    keyQuestionId?: number;
    keyAnswerValue?: number;
    bonusAnswerValue?: number | null;
}

export interface PersonalTypeProfile {
    id: number;
    name: string;
    headline: string;
    avatar: string; // デフォルトのキャッチーなニックネーム
    avatarOptions?: string[]; // バリエーション（結果ごとに使い分け）
    strengths: string[];
    caution: string;
}

export type SoloVariant =
    | '1-pos-pos'
    | '1-pos-neg'
    | '1-neg-pos'
    | '1-neg-neg'
    | '2-pos-pos'
    | '2-pos-neg'
    | '2-neg-pos'
    | '2-neg-neg'
    | '3-pos-pos'
    | '3-pos-neg'
    | '3-neg-pos'
    | '3-neg-neg'
    | '4-pos-pos'
    | '4-pos-neg'
    | '4-neg-pos'
    | '4-neg-neg';

export interface SoloVariantProfile {
    id: SoloVariant;
    label: string;
    description: string;
    avatar: string;
}

export type DuoVariant =
    | 'sync-strong'
    | 'sync-soft'
    | 'complement-active'
    | 'complement-gentle'
    | 'contrast-explore'
    | 'contrast-guard'
    | 'drift-stable'
    | 'drift-bridge';

export interface DuoVariantProfile {
    id: DuoVariant;
    title: string;
    message: string;
    tips: string[];
}

export interface PairView {
    title: string;
    message: string;
    tips: string[];
}
