import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Course } from '../types';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private _ai: GoogleGenAI | null = null;

  private get ai(): GoogleGenAI {
    if (!this._ai) {
      if (!process.env.API_KEY) {
        throw new Error(
          'API_KEY environment variable not set. Please ensure it is configured.'
        );
      }
      this._ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return this._ai;
  }

  async generateLearningExperience(pdfText: string, imageCount: number): Promise<Course> {
    const model = 'gemini-2.5-flash';
    const truncatedText = pdfText.substring(0, 150000);

    const prompt = `You are an expert instructional designer. Your task is to transform the following document text into a complete, engaging, and interactive learning course.

    You have been provided with ${imageCount} images extracted directly from the document. When creating slides, you MUST decide whether to reuse one of these images or generate a new one.

    The course structure must be as follows:
    1. An 'intro' object:
        - 'title': A compelling title for the course.
        - 'overview': A paragraph summarizing what the course is about.
        - 'learningOutcomes': An array of strings describing what the learner will know or be able to do.
        - 'courseStructure': An array of strings outlining the main sections of the course.

    2. A 'slides' array: This will be a mix of 'content', 'quiz', and 'recap' slides.
        - Create a logical flow. Start with content, then maybe a quiz, then more content, and insert a 'recap' slide after a few related topics.
        - For EACH slide, you must provide:
            - 'type': 'content', 'quiz', or 'recap'.
            - 'title': A clear title for the slide.
            - 'content': For 'content' slides, a summary paragraph (max 150 words). For 'recap' slides, a list of key bullet points separated by a newline character (\\n). For 'quiz' slides, this can be a brief context sentence.
            - IMAGE CHOICE (Choose ONE):
                - 'reusedImageIndex': If one of the ${imageCount} provided images is highly relevant, set this to its 0-based index.
                - 'imagePrompt': If NO provided image is suitable, provide a simple, descriptive prompt for an AI to generate a new, relevant visual. DO NOT set both 'reusedImageIndex' and 'imagePrompt'.
            - 'audioText': A script for audio narration, explaining the core concept.
            - 'quiz': For 'quiz' slides, create a multiple-choice question object. For all other slide types, this MUST be null. The quiz answer MUST be available in the content of a PRECEDING slide.

    CRITICAL INSTRUCTIONS:
    - Base all content STRICTLY on the provided document text.
    - Ensure a good variety of slide types.
    - Make the experience fun, engaging, and top-class.

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
            type: Type.OBJECT,
            properties: {
              intro: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  overview: { type: Type.STRING },
                  learningOutcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  courseStructure: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING, nullable: true },
                    reusedImageIndex: { type: Type.INTEGER, nullable: true },
                    audioText: { type: Type.STRING },
                    quiz: {
                      type: Type.OBJECT,
                      nullable: true,
                      properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const jsonString = response.text;
      return JSON.parse(jsonString) as Course;
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
