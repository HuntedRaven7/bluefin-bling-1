/// <reference types="@vicinae/api">

/*
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 */

type ExtensionPreferences = {
  /** Default source - The provider used when the command is launched without an explicit source. */
	"defaultProvider"?: "openai" | "openrouter" | "anthropic" | "ollama" | "hearth";

	/** Default model - Overrides the provider's default model. Leave empty to use the built-in default. */
	"defaultModel"?: string;

	/** System prompt - Instructions prepended to every prompt sent to the model. */
	"systemPrompt"?: string;

	/** OpenAI API key - Used for the OpenAI source. Stored by Compass in its secure preference store. */
	"openaiApiKey"?: string;

	/** OpenRouter API key - Used for the OpenRouter source. */
	"openrouterApiKey"?: string;

	/** Anthropic API key - Used for the Anthropic source. */
	"anthropicApiKey"?: string;

	/** Hearth API key - Used only for the Hearth route. Never reuse the OpenAI key for a third-party endpoint. */
	"hearthApiKey"?: string;

	/** OpenAI-compatible base URL - Override the OpenAI API base URL for a proxy or an OpenAI-compatible route. */
	"openaiBaseUrl"?: string;

	/** Hearth route base URL - Base URL of a hearth app route that exposes an OpenAI-compatible chat completions endpoint. */
	"hearthBaseUrl"?: string;

	/** Ollama base URL - Base URL of the local Ollama server. */
	"ollamaBaseUrl"?: string;
}

declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Command: Ask AI */
	export type Ask = Omit<ExtensionPreferences, never> & {
		
	}
}

declare namespace ToolPreferences {
  
}

declare namespace Arguments {
  /** Command: Ask AI */
	export type Ask = {
		/** Prompt */
		"prompt": string

		/** Source */
		"provider"?: "openai" | "openrouter" | "anthropic" | "ollama" | "hearth"

		/** Model (optional) */
		"model"?: string
	}
}