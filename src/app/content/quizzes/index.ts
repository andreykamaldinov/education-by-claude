import type { Quiz } from '../../domain/quiz.model';
import { ANGULAR_QUIZ } from './angular.quiz';
import { ARCHITECTURE_QUIZ, OOP_SOLID_QUIZ, PATTERNS_QUIZ } from './design.quiz';
import { JAVASCRIPT_QUIZ } from './javascript.quiz';
import { RXJS_QUIZ } from './rxjs.quiz';
import { AI_MCP_QUIZ, TOOLING_QUIZ } from './tooling.quiz';
import { TYPESCRIPT_QUIZ } from './typescript.quiz';
import { SECURITY_QUIZ, WEB_QUIZ } from './web-security.quiz';

/** Interview quizzes, one per track. */
export const QUIZZES: readonly Quiz[] = [
  JAVASCRIPT_QUIZ,
  TYPESCRIPT_QUIZ,
  ANGULAR_QUIZ,
  RXJS_QUIZ,
  WEB_QUIZ,
  SECURITY_QUIZ,
  OOP_SOLID_QUIZ,
  PATTERNS_QUIZ,
  ARCHITECTURE_QUIZ,
  TOOLING_QUIZ,
  AI_MCP_QUIZ,
];
