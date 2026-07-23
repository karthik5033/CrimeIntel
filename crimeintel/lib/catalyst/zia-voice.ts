import { getCatalystApp } from './index';

export const CatalystZiaVoice = {
  /**
   * Transcribes audio stream or buffer using Catalyst Zia Speech-To-Text API
   */
  speechToText: async (audioBlob: Blob, language: 'en' | 'kn' = 'en'): Promise<string | null> => {
    try {
      const app = getCatalystApp();
      if (app.zia) {
        const result = await app.zia().speechToText({
          audio: audioBlob,
          language_code: language === 'kn' ? 'kn-IN' : 'en-US'
        });
        if (result && result.text) {
          return result.text;
        }
      }
    } catch (e) {
      console.warn('Catalyst Zia STT note:', (e as Error).message);
    }
    return null;
  },

  /**
   * Synthesizes audio from text using Catalyst Zia Text-To-Speech API
   */
  textToSpeech: async (text: string, language: 'en' | 'kn' = 'en'): Promise<ArrayBuffer | null> => {
    try {
      const app = getCatalystApp();
      if (app.zia) {
        const audioBuffer = await app.zia().textToSpeech({
          text,
          language_code: language === 'kn' ? 'kn-IN' : 'en-US',
          voice_gender: 'Female'
        });
        return audioBuffer;
      }
    } catch (e) {
      console.warn('Catalyst Zia TTS note:', (e as Error).message);
    }
    return null;
  }
};
