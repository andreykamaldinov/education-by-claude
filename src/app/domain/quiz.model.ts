export type QuizQuestion = {
  readonly id: string;
  readonly prompt: string;
  /** Optional code snippet shown under the prompt. */
  readonly code?: string;
  readonly options: readonly [string, string, ...string[]];
  readonly correctIndex: number;
  /** Markdown explanation shown after answering. */
  readonly explanation: string;
};

export type Quiz = {
  readonly trackId: string;
  readonly questions: readonly [QuizQuestion, ...QuizQuestion[]];
};

export type QuizAnswer =
  | { readonly status: 'unanswered' }
  | { readonly status: 'answered'; readonly chosenIndex: number; readonly correct: boolean };
