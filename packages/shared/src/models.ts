export type ModelPricing = {
    inputPricePerMillionTokensInUsd: number;
    outputPricePerMillionTokensInUsd: number;
};

export type SupportedProvider = "anthropic" | "openai" | "google" | "kimi";

type SupportedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    {
        id: "claude-sonnet-4-6",
        provider: "anthropic",
        pricing: {
            inputPricePerMillionTokensInUsd: 3,
            outputPricePerMillionTokensInUsd: 15,
        },
    },
    {
        id: "claude-haiku-4-5",
        provider: "anthropic",
        pricing: {
            inputPricePerMillionTokensInUsd: 1,
            outputPricePerMillionTokensInUsd: 5,
        },
    },
    {
        id: "claude-opus-4-6",
        provider: "anthropic",
        pricing: {
            inputPricePerMillionTokensInUsd: 5,
            outputPricePerMillionTokensInUsd: 25,
        },
    },
    {
        id: "gpt-5.4",
        provider: "openai",
        pricing: {
            inputPricePerMillionTokensInUsd: 2.5,
            outputPricePerMillionTokensInUsd: 15,
        },
    },
    {
        id: "gpt-5.4-mini",
        provider: "openai",
        pricing: {
            inputPricePerMillionTokensInUsd: 0.75,
            outputPricePerMillionTokensInUsd: 4.5,
        },
    },
    {
        id: "gpt-5.4-nano",
        provider: "openai",
        pricing: {
            inputPricePerMillionTokensInUsd: 0.2,
            outputPricePerMillionTokensInUsd: 1.25,
        },
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gpt-5.4-nano";