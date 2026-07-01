export function shouldRestartListening(options: {
  voiceMode: boolean;
  isListening: boolean;
  isSending: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  hasSpeechRecognition: boolean;
}): boolean {
  return Boolean(
    options.voiceMode &&
      options.hasSpeechRecognition &&
      !options.isListening &&
      !options.isSending &&
      !options.isSpeaking &&
      !options.isLoading,
  );
}
