
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { GeminiService } from './services/gemini.service';
import { Slide } from './types';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { LearningViewComponent } from './components/learning-view/learning-view.component';

@Component({
  selector: 'app-root',
  template: `
<main class="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-hidden">
  <div class="absolute top-0 left-0 -z-10 h-full w-full bg-white">
    <div class="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(173,109,244,0.5)] opacity-50 blur-[80px]"></div>
  </div>

  <div class="w-full max-w-7xl mx-auto">
    <header class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <svg class="w-8 h-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <h1 class="text-2xl font-bold text-slate-800">PDF Learner</h1>
      </div>
      @if(viewState() === 'learning' || viewState() === 'error') {
        <button (click)="startOver()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
          Start New
        </button>
      }
    </header>

    @switch (viewState()) {
      @case ('upload') {
        <app-file-upload (pdfTextExtracted)="onPdfTextExtracted($event)" />
      }
      @case ('generating') {
        <div class="flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200">
            <svg class="animate-spin h-12 w-12 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Generating Your Course...</h2>
            <p class="text-slate-600 mb-6">{{ generationMessage() }}</p>
            <div class="w-full max-w-md bg-gray-200 rounded-full h-2.5">
                <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" [style.width.%]="generationProgress()"></div>
            </div>
        </div>
      }
      @case ('learning') {
        <app-learning-view [slides]="slides()" />
      }
      @case ('error') {
        <div class="text-center p-8 bg-red-50 rounded-2xl shadow-lg border border-red-200">
          <h2 class="text-2xl font-bold text-red-800 mb-2">An Error Occurred</h2>
          <p class="text-red-700">{{ errorMessage() }}</p>
        </div>
      }
    }
  </div>
</main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileUploadComponent, LearningViewComponent],
})
export class AppComponent {
  viewState = signal<'upload' | 'generating' | 'learning' | 'error'>('upload');
  slides = signal<Slide[]>([]);
  errorMessage = signal<string>('');
  generationProgress = signal<number>(0);
  generationMessage = signal<string>('');

  constructor(private geminiService: GeminiService) {
    // The pdf.js worker setup was moved to FileUploadComponent to prevent
    // a potential race condition that could cause a blank screen on startup.
  }

  async onPdfTextExtracted(pdfText: string) {
    if (!pdfText.trim()) {
      this.errorMessage.set('Could not extract any text from the PDF. Please try another file.');
      this.viewState.set('error');
      return;
    }

    this.viewState.set('generating');
    try {
      this.generationMessage.set('Structuring content into lessons...');
      const slideSkeletons = await this.geminiService.generateLearningExperience(pdfText);
      if (!slideSkeletons || slideSkeletons.length === 0) {
          throw new Error("AI failed to generate any slides from the provided text.");
      }
      this.slides.set(slideSkeletons.map(s => ({ ...s, imageLoading: true })));
      this.generationProgress.set(10); // 10% for content structure

      this.generationMessage.set('Generating visuals for each slide...');
      const imagePromises = this.slides().map((slide, index) => {
        return this.geminiService.generateImage(slide.imagePrompt).then(imageUrl => {
          this.slides.update(currentSlides => {
            const newSlides = [...currentSlides];
            newSlides[index] = { ...newSlides[index], imageUrl, imageLoading: false };
            return newSlides;
          });
          // Update progress based on images generated
          const progress = 10 + ( (index + 1) / this.slides().length) * 90;
          this.generationProgress.set(Math.round(progress));
        });
      });
      
      await Promise.all(imagePromises);

      this.viewState.set('learning');
    } catch (error) {
      console.error(error);
      const err = error as Error;
      this.errorMessage.set(err.message || 'An unknown error occurred during content generation.');
      this.viewState.set('error');
    }
  }

  startOver() {
    this.viewState.set('upload');
    this.slides.set([]);
    this.errorMessage.set('');
    this.generationProgress.set(0);
    this.generationMessage.set('');
  }
}
