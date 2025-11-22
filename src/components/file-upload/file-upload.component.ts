
import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';

// Declare pdfjsLib to avoid TypeScript errors for the CDN-loaded library
declare const pdfjsLib: any;

@Component({
  selector: 'app-file-upload',
  template: `
<div class="w-full p-8 bg-white/50 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200">
  <div class="text-center">
    <h2 class="text-3xl font-bold text-slate-800 mb-2">Create Your Interactive Course</h2>
    <p class="text-slate-600 max-w-2xl mx-auto">Upload a PDF document, and our AI will transform it into a dynamic learning experience with visuals, audio, and quizzes.</p>
  </div>

  <div 
    (dragover)="onDragOver($event)"
    (dragleave)="onDragLeave($event)"
    (drop)="onDrop($event)"
    [class.bg-indigo-50]="isDragOver()"
    [class.border-indigo-400]="isDragOver()"
    class="mt-8 border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center transition-colors duration-200">
    <div class="flex flex-col items-center justify-center">
      <svg class="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
      <p class="mt-4 text-slate-600">Drag & drop your PDF here, or <label for="file-upload" class="font-semibold text-indigo-600 cursor-pointer hover:underline">browse files</label></p>
      <input id="file-upload" type="file" class="hidden" accept=".pdf" (change)="onFileSelected($event)">
      @if(isProcessing()){
        <div class="mt-4 flex items-center text-slate-500">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing your PDF...</span>
        </div>
      }
      @if(processingError()) {
        <p class="mt-4 text-sm text-red-600">{{ processingError() }}</p>
      }
    </div>
  </div>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  pdfTextExtracted = output<string>();
  isProcessing = signal(false);
  processingError = signal<string | null>(null);
  isDragOver = signal(false);

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        this.processFile(file);
      } else {
        this.processingError.set('Invalid file type. Please upload a PDF.');
      }
      event.dataTransfer.clearData();
    }
  }

  private async processFile(file: File) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    this.processingError.set(null);

    try {
      // Set up pdf.js worker right before use to avoid startup race conditions.
      // This is the most reliable way to ensure the library is loaded.
      if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) {
        throw new Error('PDF processing library failed to load. Please refresh the page and try again.');
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      this.pdfTextExtracted.emit(fullText);

    } catch (error) {
      console.error('Error processing PDF:', error);
      const message = error instanceof Error ? error.message : 'Could not process the PDF. It may be corrupted or protected.';
      this.processingError.set(message);
      this.isProcessing.set(false);
    }
  }
}
