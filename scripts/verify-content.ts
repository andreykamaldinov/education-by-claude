/**
 * Content integrity check: `npm run verify:content`.
 *
 * 1. Every lesson in the catalog has a markdown file, and every markdown file belongs to a lesson.
 * 2. Internal links in lessons and exercise descriptions point to existing lessons and exercises.
 * 3. Every reference solution passes its tests, and every starter fails at least one —
 *    executed by the same `executeTests` the browser sandbox uses.
 * 4. Quiz questions are well-formed.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as rxjs from 'rxjs';
import { transform } from 'sucrase';
import { EXERCISES } from '../src/app/content/exercises/index';
import { QUIZZES } from '../src/app/content/quizzes/index';
import { TRACKS } from '../src/app/content/tracks/index';
import type { RuntimeLanguage } from '../src/app/domain/exercise.model';
import { executeTests } from '../src/app/features/practice/runner/execute';

// Starter code is incomplete by design and may leave promises rejected without a handler.
process.on('unhandledRejection', () => undefined);

const CONTENT_DIR = join(process.cwd(), 'public', 'content');
const problems: string[] = [];
const fail = (message: string): void => {
  problems.push(message);
};

const lessonKeys = new Set(
  TRACKS.flatMap((track) => track.sections.flatMap((s) => s.lessons.map((l) => `${track.id}/${l.id}`))),
);
const exerciseIds = new Set(EXERCISES.map((e) => e.id));

const checkLessonFiles = (): void => {
  for (const key of lessonKeys) {
    if (!existsSync(join(CONTENT_DIR, `${key}.md`))) fail(`Нет файла урока: content/${key}.md`);
  }
  for (const trackDir of readdirSync(CONTENT_DIR)) {
    for (const file of readdirSync(join(CONTENT_DIR, trackDir))) {
      const key = `${trackDir}/${file.replace(/\.md$/, '')}`;
      if (!lessonKeys.has(key)) fail(`Файл не привязан к каталогу: content/${key}.md`);
    }
  }
};

const checkLinks = (source: string, origin: string): void => {
  for (const match of source.matchAll(/\]\((\/[^)\s]+)\)/g)) {
    const url = (match[1] ?? '').split('#')[0] ?? '';
    const lesson = /^\/tracks\/([\w-]+)\/([\w-]+)$/.exec(url);
    const track = /^\/tracks\/([\w-]+)$/.exec(url);
    const exercise = /^\/practice\/([\w-]+)$/.exec(url);
    if (lesson && !lessonKeys.has(`${lesson[1]}/${lesson[2]}`)) fail(`${origin}: битая ссылка ${url}`);
    if (track && !TRACKS.some((t) => t.id === track[1])) fail(`${origin}: битая ссылка ${url}`);
    if (exercise && !exerciseIds.has(exercise[1] ?? '')) fail(`${origin}: ссылка на несуществующую задачу ${url}`);
  }
};

const transpile = (code: string, language: RuntimeLanguage): string =>
  language === 'typescript' ? transform(code, { transforms: ['typescript'], disableESTransforms: true }).code : code;

const env = { transpile, globals: { rxjs }, testTimeoutMs: 4000 };

const checkExercises = async (): Promise<void> => {
  const seen = new Set<string>();
  for (const exercise of EXERCISES) {
    if (seen.has(exercise.id)) fail(`Дублируется id задачи: ${exercise.id}`);
    seen.add(exercise.id);
    if (!TRACKS.some((t) => t.id === exercise.trackId)) fail(`${exercise.id}: неизвестный трек ${exercise.trackId}`);
    if (exercise.relatedLessonId && !lessonKeys.has(`${exercise.trackId}/${exercise.relatedLessonId}`)) {
      fail(`${exercise.id}: неизвестный урок ${exercise.relatedLessonId}`);
    }
    checkLinks(exercise.description, `задача ${exercise.id}`);

    const solved = await executeTests({ language: exercise.language, code: exercise.solution, tests: exercise.tests }, env);
    if (solved.kind !== 'completed') {
      fail(`${exercise.id}: решение не запустилось (${solved.kind === 'compile-error' ? solved.message : 'timeout'})`);
    } else {
      for (const test of solved.tests) {
        if (test.status === 'failed') fail(`${exercise.id}: решение не проходит «${test.name}»: ${test.message}`);
      }
    }

    const starter = await executeTests({ language: exercise.language, code: exercise.starter, tests: exercise.tests }, env);
    if (starter.kind === 'completed' && starter.tests.every((t) => t.status === 'passed')) {
      fail(`${exercise.id}: стартовый код проходит все тесты — задача ничего не проверяет`);
    }
  }
};

const checkQuizzes = (): void => {
  for (const quiz of QUIZZES) {
    if (!TRACKS.some((t) => t.id === quiz.trackId)) fail(`Квиз для неизвестного трека ${quiz.trackId}`);
    const ids = new Set<string>();
    for (const q of quiz.questions) {
      if (ids.has(q.id)) fail(`Квиз ${quiz.trackId}: повтор id ${q.id}`);
      ids.add(q.id);
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) fail(`Квиз ${quiz.trackId}/${q.id}: неверный correctIndex`);
      checkLinks(q.explanation, `квиз ${quiz.trackId}/${q.id}`);
    }
  }
};

checkLessonFiles();
for (const key of lessonKeys) {
  const file = join(CONTENT_DIR, `${key}.md`);
  if (existsSync(file)) checkLinks(readFileSync(file, 'utf8'), relative(process.cwd(), file));
}
checkQuizzes();
await checkExercises();

const questionCount = QUIZZES.reduce((sum, quiz) => sum + quiz.questions.length, 0);
console.log(
  `Уроков: ${lessonKeys.size}, задач: ${EXERCISES.length}, вопросов: ${questionCount}, треков: ${TRACKS.length}`,
);
if (problems.length > 0) {
  console.error(`\nНайдено проблем: ${problems.length}`);
  problems.forEach((p) => console.error(` - ${p}`));
  process.exit(1);
}
console.log('Контент в порядке ✓');
