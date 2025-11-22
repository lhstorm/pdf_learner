
export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Slide {
  title: string;
  content: string;
  imagePrompt: string;
  audioText: string;
  quiz: Quiz | null;
  // Dynamic properties
  imageUrl?: string;
  imageLoading?: boolean;
}
