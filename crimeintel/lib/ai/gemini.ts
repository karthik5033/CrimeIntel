import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

class GeminiKeyManager {
  private keys: string[] = [];
  private currentIndex = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    // Explicitly read .env.local to bypass Next.js dev server caching
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        for (let i = 1; i <= 12; i++) {
          const key = envConfig[`GOOGLE_API_KEY_${i}`];
          if (key) {
            this.keys.push(key);
          }
        }
        if (envConfig['GOOGLE_API_KEY'] && !this.keys.includes(envConfig['GOOGLE_API_KEY'])) {
          this.keys.push(envConfig['GOOGLE_API_KEY']);
        }
      }
    } catch (err) {
      console.warn("Failed to manually parse .env.local:", err);
    }

    // Add process.env fallback keys if not already present
    for (let i = 1; i <= 12; i++) {
      const key = process.env[`GOOGLE_API_KEY_${i}`];
      if (key && !this.keys.includes(key)) {
        this.keys.push(key);
      }
    }
    if (process.env.GOOGLE_API_KEY && !this.keys.includes(process.env.GOOGLE_API_KEY)) {
      this.keys.push(process.env.GOOGLE_API_KEY);
    }

    if (this.keys.length === 0) {
      console.warn('⚠️ No GOOGLE_API_KEY_n found in environment variables. Gemini will fail.');
    }
  }

  public getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No Google API keys available for Gemini API.');
    }
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  public removeKey(key: string) {
    this.keys = this.keys.filter(k => k !== key);
    if (this.keys.length > 0) {
      this.currentIndex = this.currentIndex % this.keys.length;
    }
  }
}

const keyManager = new GeminiKeyManager();

export const GeminiService = {
  /**
   * Helper to execute API calls with retry logic on 403 errors
   */
  async executeWithRetry<T>(operation: (ai: any) => Promise<T>, model: string): Promise<T> {
    let lastError = null;
    let attempts = 0;
    // Try up to 13 times (12 user keys + 1 global key)
    while (attempts < 13) {
      let apiKey;
      try {
        apiKey = keyManager.getNextKey();
      } catch (err) {
        throw lastError || err;
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        return await operation(ai);
      } catch (error: any) {
        lastError = error;
        // If Permission Denied (403) or Invalid Key (400), remove the key and retry
        if (error.message && (error.message.includes('403') || error.message.includes('PERMISSION_DENIED') || error.message.includes('API_KEY_INVALID'))) {
          console.warn(`API Key failed with permission error, removing from pool. Retrying...`);
          keyManager.removeKey(apiKey);
        } else {
          // If it's a different error (e.g. rate limit 429), maybe we should just rotate?
          // We'll rotate by just retrying, since getNextKey increments index.
          console.warn(`API call failed, retrying with next key...`, error.message);
        }
        attempts++;
      }
    }
    console.error(`Gemini API failed after ${attempts} attempts.`);
    throw lastError;
  },

  /**
   * Generates a standard conversational response.
   */
  async generateResponse(
    prompt: string, 
    systemInstruction?: string,
    model: string = 'gemini-2.5-flash'
  ): Promise<string> {
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    return this.executeWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
      return response.text || '';
    }, model);
  },

  /**
   * Generates a structured JSON response matching the provided schema.
   */
  async generateJsonResponse<T>(
    prompt: string,
    schema: any,
    systemInstruction?: string,
    model: string = 'gemini-2.5-flash'
  ): Promise<T> {
    const config: any = {
      responseMimeType: 'application/json',
      responseSchema: schema
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    return this.executeWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });

      if (!response.text) {
        throw new Error('Empty response from Gemini JSON generation');
      }

      return JSON.parse(response.text) as T;
    }, model);
  }
};
