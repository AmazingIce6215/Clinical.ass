// Re-export Groq functions for backward compatibility
export {
  AI_MODELS,
  isGroqConfigured,
  getGroqClient,
  formatAiError,
  aiJsonCompletion,
} from "./groq";
export type { AiResult } from "./groq";
