
import { Component, ChangeDetectionStrategy, input, signal, computed, WritableSignal } from '@angular/core';
import { Slide } from '../../types';

type QuizStatus = 'unanswered' | 'correct' | 'incorrect';

@Component({
  selector: 'app-learning-view',
  template: `
<div class="w-full bg-white/50 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200 overflow-hidden">
  <!-- Progress Bar -->
  <div class="w-full bg-gray-200 h-2.5">
    <div class="bg-indigo-600 h-2.5 transition-all duration-300" [style.width.%]="progress()"></div>
  </div>

  @if (currentSlide(); as slide) {
    <div class="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
      <!-- Image Pane -->
      <div class="bg-slate-100 flex items-center justify-center p-4">
        @if (slide.imageLoading) {
          <div class="flex flex-col items-center text-slate-500">
            <svg class="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating Visual...</span>
          </div>
        } @else {
          <img [src]="slide.imageUrl" alt="{{ slide.imagePrompt }}" class="max-h-[50vh] w-auto object-contain rounded-lg shadow-md">
        }
      </div>

      <!-- Content Pane -->
      <div class="p-8 flex flex-col">
        <div class="flex-grow">
          <h2 class="text-3xl font-bold text-slate-800 mb-4">{{ slide.title }}</h2>
          @if (!slide.quiz) {
            <p class="text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-2">{{ slide.content }}</p>
          } @else {
            <div class="space-y-4">
              <p class="text-black font-semibold text-lg">{{ slide.quiz.question }}</p>
              <div class="space-y-3">
                @for (option of slide.quiz.options; track option; let i = $index) {
                  <button 
                    (click)="handleQuizAnswer(option, i)"
                    [disabled]="quizStatus() !== 'unanswered'"
                    [class.bg-green-100]="quizStatus() === 'correct' && selectedAnswer() === i"
                    [class.border-green-500]="quizStatus() === 'correct' && selectedAnswer() === i"
                    [class.text-green-800]="quizStatus() === 'correct' && selectedAnswer() === i"
                    [class.bg-red-100]="quizStatus() === 'incorrect' && selectedAnswer() === i"
                    [class.border-red-500]="quizStatus() === 'incorrect' && selectedAnswer() === i"
                    [class.text-red-800]="quizStatus() === 'incorrect' && selectedAnswer() === i"
                    [class.hover:bg-indigo-50]="quizStatus() === 'unanswered'"
                    [class.cursor-default]="quizStatus() !== 'unanswered'"
                    class="w-full text-left p-4 border rounded-lg transition-colors text-black">
                    {{ option }}
                  </button>
                }
              </div>
              @if (quizStatus() === 'correct') {
                  <p class="text-green-600 font-semibold mt-4">Correct! Well done.</p>
              }
              @if (quizStatus() === 'incorrect') {
                  <p class="text-red-600 font-semibold mt-4">Not quite. The correct answer was: {{ slide.quiz.correctAnswer }}</p>
              }
            </div>
          }
        </div>
        
        <!-- Controls -->
        <div class="mt-8 flex justify-between items-center">
          <span class="text-sm font-medium text-slate-500">Lesson {{ currentIndex() + 1 }} of {{ slides().length }}</span>
          <div class="flex items-center gap-2">
            <button (click)="playAudio()" title="Read aloud" class="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors">
              <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            </button>
            <button (click)="prevSlide()" [disabled]="currentIndex() === 0" class="px-4 py-2 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Back
            </button>
            <button 
              (click)="nextSlide()" 
              [disabled]="slide.quiz && quizStatus() === 'unanswered'"
              class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  } @else if(showCompletion()) {
     <div class="p-12 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <h2 class="text-4xl font-bold text-slate-800 mb-3">Course Completed!</h2>
      <p class="text-slate-600 text-lg">You've done a great job working through the material.</p>
      <div class="my-8 p-6 bg-indigo-50 rounded-xl">
        <p class="text-lg text-slate-700">Your Score</p>
        <p class="text-5xl font-bold text-indigo-600">{{ score() }} / {{ totalQuizzes() }}</p>
      </div>
       <p class="text-slate-500">You can start a new course with another PDF at any time.</p>
    </div>
  }
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningViewComponent {
  slides = input.required<Slide[]>();

  currentIndex = signal(0);
  quizStatus: WritableSignal<QuizStatus> = signal('unanswered');
  selectedAnswer = signal<number | null>(null);
  showCompletion = signal(false);
  score = signal(0);
  
  synth = window.speechSynthesis;

  currentSlide = computed(() => {
    if (this.showCompletion()) return null;
    return this.slides()[this.currentIndex()];
  });

  totalQuizzes = computed(() => {
    return this.slides().filter(s => s.quiz).length;
  });

  progress = computed(() => {
    const slides = this.slides();
    if (!slides || slides.length === 0) {
      return 0;
    }
    return ((this.currentIndex() + 1) / slides.length) * 100;
  });

  nextSlide() {
    if (this.currentIndex() < this.slides().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.resetQuizState();
    } else {
      this.showCompletion.set(true);
    }
  }

  prevSlide() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      this.resetQuizState();
    }
  }
  
  handleQuizAnswer(option: string, index: number) {
    if (this.quizStatus() !== 'unanswered') return;

    this.selectedAnswer.set(index);
    const correct = option === this.currentSlide()?.quiz?.correctAnswer;
    if (correct) {
      this.quizStatus.set('correct');
      this.score.update(s => s + 1);
    } else {
      this.quizStatus.set('incorrect');
    }
  }

  playAudio() {
    const slide = this.currentSlide();
    if (slide && slide.audioText) {
      if (this.synth.speaking) {
        this.synth.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(slide.audioText);
      this.synth.speak(utterance);
    }
  }

  private resetQuizState() {
    this.quizStatus.set('unanswered');
    this.selectedAnswer.set(null);
  }
}
