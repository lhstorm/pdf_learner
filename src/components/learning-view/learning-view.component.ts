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
    @switch (slide.type) {
      @case ('intro') {
        <div class="p-8 md:p-12 flex flex-col items-center text-center min-h-[60vh] justify-center">
          <h1 class="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4">{{ slide.title }}</h1>
          <p class="text-slate-600 text-lg max-w-3xl mb-8">{{ slide.overview }}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <div class="bg-white/60 p-6 rounded-xl shadow-sm border">
              <h3 class="font-bold text-xl mb-3 text-indigo-700">Learning Outcomes</h3>
              <ul class="text-left space-y-2">
                @for(item of slide.learningOutcomes; track item) {
                  <li class="flex items-start gap-2 text-slate-700">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </div>
            <div class="bg-white/60 p-6 rounded-xl shadow-sm border">
              <h3 class="font-bold text-xl mb-3 text-indigo-700">Course Structure</h3>
               <ul class="text-left space-y-2">
                @for(item of slide.courseStructure; track item) {
                  <li class="flex items-start gap-2 text-slate-700">
                     <svg class="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.5a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0A2.25 2.25 0 0 1 6 7.5h12a2.25 2.25 0 0 1 2.25 2.25m-16.5 0v-1.5c0-.621.504-1.125 1.125-1.125h13.5c.621 0 1.125.504 1.125 1.125v1.5" /></svg>
                     <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
           <div class="mt-12">
            <button (click)="nextSlide()" class="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg transition-transform hover:scale-105">
              Let's Begin!
            </button>
          </div>
        </div>
      }
      @case ('recap') {
        <div class="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
          <div class="bg-indigo-50 flex flex-col items-center justify-center p-8 text-center">
             <svg class="w-20 h-20 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            <h2 class="text-4xl font-bold text-indigo-800">{{ slide.title }}</h2>
          </div>
          <div class="p-8 flex flex-col">
            <div class="flex-grow">
              <ul class="space-y-4">
                @for(item of slide.content.split('\n'); track item) {
                  @if(item.trim()) {
                    <li class="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                      <svg class="w-6 h-6 text-green-500 mt-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span class="text-slate-700 text-lg">{{ item }}</span>
                    </li>
                  }
                }
              </ul>
            </div>
            <div class="mt-8 flex justify-end items-center">
              <button (click)="nextSlide()" class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                Continue
              </button>
            </div>
          </div>
        </div>
      }
      @default {
        <div class="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
          <!-- Image & Audio Pane -->
          <div class="bg-slate-100 flex flex-col items-center justify-center p-4 gap-4">
            <div class="flex-grow flex items-center justify-center w-full">
                @if (slide.imageLoading) {
                  <div class="flex flex-col items-center text-slate-500">
                    <svg class="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Preparing Visual...</span>
                  </div>
                } @else {
                  <img [src]="slide.imageUrl" alt="Slide visual" class="max-h-[50vh] w-auto object-contain rounded-lg shadow-md">
                }
            </div>
            <div class="w-full max-w-xl p-4 bg-white/60 rounded-lg shadow">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-700">Audio Narration</span>
                  <div class="flex items-center gap-2">
                    <button (click)="toggleAudio()" [title]="isPlaying() ? 'Pause audio' : 'Play audio'" class="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors">
                      @if (!isPlaying()) {
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
                      } @else {
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" /></svg>
                      }
                    </button>
                    <button (click)="toggleTranscript()" title="View transcript" class="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors">
                       <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                    </button>
                  </div>
                </div>
                @if (showTranscript()) {
                  <div class="mt-4 p-3 bg-slate-50 rounded-md max-h-48 overflow-y-auto border">
                    <p class="text-slate-600 text-sm leading-relaxed">{{ slide.audioText }}</p>
                  </div>
                }
              </div>
          </div>

          <!-- Content Pane -->
          <div class="p-8 flex flex-col">
            <div class="flex-grow">
              <h2 class="text-3xl font-bold text-slate-800 mb-4">{{ slide.title }}</h2>
              @if (slide.type === 'content') {
                <p class="text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-2">{{ slide.content }}</p>
              } @else if (slide.quiz) {
                <div class="space-y-4">
                  <p class="text-black font-semibold text-lg">{{ slide.quiz.question }}</p>
                  <div class="space-y-3">
                    @for (option of slide.quiz.options; track option; let i = $index) {
                      <button (click)="handleQuizAnswer(option, i)" [disabled]="quizStatus() !== 'unanswered'"
                        [class.bg-green-100]="quizStatus() === 'correct' && selectedAnswer() === i" [class.border-green-500]="quizStatus() === 'correct' && selectedAnswer() === i" [class.text-green-800]="quizStatus() === 'correct' && selectedAnswer() === i"
                        [class.bg-red-100]="quizStatus() === 'incorrect' && selectedAnswer() === i" [class.border-red-500]="quizStatus() === 'incorrect' && selectedAnswer() === i" [class.text-red-800]="quizStatus() === 'incorrect' && selectedAnswer() === i"
                        [class.hover:bg-indigo-50]="quizStatus() === 'unanswered'" [class.cursor-default]="quizStatus() !== 'unanswered'"
                        class="w-full text-left p-4 border rounded-lg transition-colors text-black">
                        {{ option }}
                      </button>
                    }
                  </div>
                  @if (quizStatus() === 'correct') { <p class="text-green-600 font-semibold mt-4">Correct! Well done.</p> }
                  @if (quizStatus() === 'incorrect') { <p class="text-red-600 font-semibold mt-4">Not quite. The correct answer was: {{ slide.quiz.correctAnswer }}</p> }
                </div>
              }
            </div>
            
            <!-- Controls -->
            <div class="mt-8 flex justify-between items-center">
              <span class="text-sm font-medium text-slate-500">Lesson {{ currentIndex() + 1 }} of {{ slides().length }}</span>
              <div class="flex items-center gap-2">
                <button (click)="prevSlide()" [disabled]="currentIndex() === 0" class="px-4 py-2 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Back
                </button>
                <button (click)="nextSlide()" [disabled]="slide.quiz && quizStatus() === 'unanswered'"
                  class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    }
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
  isPlaying = signal(false);
  showTranscript = signal(false);
  
  synth = window.speechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;

  currentSlide = computed(() => {
    if (this.showCompletion()) return null;
    return this.slides()[this.currentIndex()];
  });

  totalQuizzes = computed(() => this.slides().filter(s => s.quiz).length);

  progress = computed(() => {
    const slides = this.slides();
    if (!slides || slides.length === 0) return 0;
    // Don't show 100% until completion screen
    if (this.currentIndex() === slides.length - 1 && !this.showCompletion()) {
        return (this.currentIndex() / slides.length) * 100;
    }
    return ((this.currentIndex() + 1) / slides.length) * 100;
  });

  nextSlide() {
    // For intro slide, the button is the only control
    if (this.currentSlide()?.type === 'intro') {
        this.currentIndex.update(i => i + 1);
        this.resetSlideState();
        return;
    }
    if (this.currentIndex() < this.slides().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.resetSlideState();
    } else {
      this.showCompletion.set(true);
    }
  }

  prevSlide() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      this.resetSlideState();
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

  toggleAudio() {
    const slide = this.currentSlide();
    if (!slide || !slide.audioText) return;

    if (this.synth.paused) {
      this.synth.resume();
      this.isPlaying.set(true);
      return;
    }

    if (this.synth.speaking) {
      this.synth.pause();
      this.isPlaying.set(false);
      return;
    }

    this.synth.cancel();
    this.utterance = new SpeechSynthesisUtterance(slide.audioText);
    this.utterance.onend = () => this.isPlaying.set(false);
    this.synth.speak(this.utterance);
    this.isPlaying.set(true);
  }

  toggleTranscript() {
    this.showTranscript.update(v => !v);
  }

  private resetSlideState() {
    this.quizStatus.set('unanswered');
    this.selectedAnswer.set(null);
    if (this.synth.speaking || this.synth.paused) {
      this.synth.cancel();
    }
    this.isPlaying.set(false);
    this.showTranscript.set(false);
    this.utterance = null;
  }
}
