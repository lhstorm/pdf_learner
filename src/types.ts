export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Intro {
  title: string;
  overview: string;
  learningOutcomes: string[];
  courseStructure: string[];
}

export interface Course {
  intro: Intro;
  slides: SlideContent[];
}

export interface SlideContent {
  type: 'content' | 'quiz' | 'recap';
  title: string;
  content: string; // Used for content slides and recap points (joined by newline)
  imagePrompt?: string; // Prompt for a new image
  reusedImageIndex?: number; // Index of an image extracted from the PDF
  audioText: string;
  quiz: Quiz | null;
}

// This is the flattened type used by the view component
// FIX: The 'Slide' interface cannot directly extend 'SlideContent' because it widens the 'type' property.
// Using Omit allows us to inherit all properties from 'SlideContent' except for 'type',
// which we can then redefine with the wider set of string literals.
export interface Slide extends Omit<SlideContent, 'type'> {
  // For intro slides, the type will be 'intro'
  type: 'content' | 'quiz' | 'recap' | 'intro';
  // Dynamic properties
  imageUrl?: string;
  imageLoading?: boolean;
  // Properties for the intro slide specifically
  overview?: string;
  learningOutcomes?: string[];
  courseStructure?: string[];
}
