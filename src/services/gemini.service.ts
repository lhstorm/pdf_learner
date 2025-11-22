import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Slide } from '../types';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private _ai: GoogleGenAI | null = null;

  private get ai(): GoogleGenAI {
    if (!this._ai) {
      // IMPORTANT: This assumes process.env.API_KEY is available in the execution environment.
      if (!process.env.API_KEY) {
        throw new Error(
          'API_KEY environment variable not set. Please ensure it is configured.'
        );
      }
      this._ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return this._ai;
  }

  async generateLearningExperience(pdfText: string): Promise<Slide[]> {
    const model = 'gemini-2.5-flash';
    const truncatedText = pdfText.substring(0, 100000); // Truncate to a reasonable length

    const prompt = `You are an expert instructional designer. Your task is to transform the following document text into a concise, engaging, and interactive learning experience.
    Break the content down into a series of focused slides. For each slide, you must provide:
    1. A clear 'title'.
    2. A 'content' paragraph summarizing the key information (max 150 words).
    3. An 'imagePrompt' which is a simple, descriptive phrase for an AI image generator to create a relevant visual.
    4. An 'audioText' which is a script to be read aloud, explaining the slide's core concept clearly.
    5. A 'quiz' object with a multiple-choice question to test understanding, but only if a testable concept is present. If not, the quiz should be null. The quiz must have a 'question', an array of 'options', and the exact 'correctAnswer' string.

    Document Text:
    ---
    ${truncatedText}
    ---
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                audioText: { type: Type.STRING },
                quiz: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswer: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const jsonString = response.text;
      return JSON.parse(jsonString) as Slide[];
    } catch (error) {
      console.error('Error generating learning experience:', error);
      throw new Error('Failed to generate learning content from the PDF.');
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const model = 'imagen-4.0-generate-001';
    try {
      const response = await this.ai.models.generateImages({
        model,
        prompt: `A clean, professional illustration for a learning module about: ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
      console.error('Error generating image:', error);
      return 'https://picsum.photos/1280/720?random=' + Math.random(); // Fallback image
    }
  }
}
