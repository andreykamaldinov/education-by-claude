import type { Exercise } from '../../domain/exercise.model';
import { ANGULAR_EXERCISES } from './angular.exercises';
import { DESIGN_EXERCISES } from './design.exercises';
import { JAVASCRIPT_EXERCISES } from './javascript.exercises';
import { RXJS_EXERCISES } from './rxjs.exercises';
import { SECURITY_EXERCISES } from './security.exercises';
import { TOOLING_EXERCISES } from './tooling.exercises';
import { TYPESCRIPT_EXERCISES } from './typescript.exercises';
import { WEB_EXERCISES } from './web.exercises';

/**
 * All practice exercises in display order. To add exercises for a new track,
 * create `<track>.exercises.ts` and spread it here; `npm run verify:content`
 * checks that every reference solution passes its tests.
 */
export const EXERCISES: readonly Exercise[] = [
  ...JAVASCRIPT_EXERCISES,
  ...TYPESCRIPT_EXERCISES,
  ...ANGULAR_EXERCISES,
  ...RXJS_EXERCISES,
  ...WEB_EXERCISES,
  ...SECURITY_EXERCISES,
  ...DESIGN_EXERCISES,
  ...TOOLING_EXERCISES,
];
