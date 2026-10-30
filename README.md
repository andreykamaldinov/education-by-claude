# DevShelf

Учебная платформа фронтенд-разработчика: теория, практика с автотестами в браузере и вопросы для подготовки к собеседованию. Сейчас здесь 11 треков, 134 урока, 60 задач и 111 вопросов. Треки покрывают JavaScript, TypeScript, Angular 22, RxJS, Web, Security, ООП и SOLID, паттерны, архитектуру, инструменты сборки (Vite, webpack, Nx, Module и Native Federation) и AI/MCP.

## Запуск

```bash
npm install
npm start                 # http://localhost:4200
npm test                  # юнит-тесты (Vitest)
npm run verify:content    # проверка контента: уроки ↔ каталог, ссылки, задачи, тесты
npm run build
```

`verify:content` прогоняет эталонное решение каждой задачи через её тесты. Он же проверяет, что стартовый код падает хотя бы на одном тесте. Запускайте его после любых правок в `src/app/content` или `public/content`.

## Деплой на GitHub Pages

Деплой настроен в `.github/workflows/deploy.yml` и запускается при каждом push в `main` (или вручную во вкладке Actions).

1. Создайте репозиторий на GitHub и запушьте проект в ветку `main`.
2. В репозитории откройте **Settings → Pages** и в поле **Source** выберите **GitHub Actions**.
3. Дождитесь зелёного workflow во вкладке **Actions**. Сайт появится по адресу `https://<логин>.github.io/<репозиторий>/`.

Workflow сначала прогоняет `verify:content` и юнит-тесты. Затем собирает приложение с `--base-href /<репозиторий>/` (для репозитория `<логин>.github.io` — с `/`). В конце кладёт копию `index.html` в `404.html`: у GitHub Pages нет серверных rewrite, поэтому прямые ссылки вроде `/tracks/angular/signals` открываются через этот файл.

## Как устроено

```
src/app/
  domain/        типы предметной области: Track, Lesson, Exercise, Quiz, RunResult
  content/       данные: треки, задачи, тесты + сервисы-каталоги (через InjectionToken)
  core/          сквозное: прогресс, тема, поиск (Ctrl+K), localStorage, заголовки
  shared/        markdown-рендер, иконки, утилиты
  features/      страницы: home, track, lesson, practice, quiz, not-found
public/content/  тексты уроков: <trackId>/<lessonId>.md
scripts/         проверка контента
```

- Angular 22: standalone, zoneless, OnPush, сигналы, `httpResource`, lazy-роуты с `canMatch`-гардами.
- Уроки написаны в Markdown. Подсветка кода сделана на highlight.js, а для выносок есть синтаксис `> [!TIP]`, `> [!NOTE]`, `> [!WARNING]`, `> [!INTERVIEW]`.
- Задачи выполняются в Web Worker с таймаутом 6 секунд, поэтому бесконечный цикл не повесит вкладку. TypeScript транспилируется через sucrase, RxJS доступен глобально.
- Прогресс хранится в localStorage браузера.

## Как расширять

**Новый трек** (например, Node.js или Python):

1. Создайте `src/app/content/tracks/<id>.track.ts` с объектом `... as const satisfies Track` и добавьте его в `TRACKS` в `tracks/index.ts`.
2. Для каждого урока положите `public/content/<id>/<lessonId>.md`.
3. Задачи пишутся в `content/exercises/<id>.exercises.ts` и подключаются в `exercises/index.ts`. Вопросы пишутся в `content/quizzes/<id>.quiz.ts` и подключаются в `quizzes/index.ts`.
4. Запустите `npm run verify:content`.

**Новый язык исполнения** (например, Python через Pyodide):

1. Добавьте язык в `RUNTIME_LANGUAGES` (`domain/exercise.model.ts`).
2. Реализуйте `CodeRunner` (`features/practice/runner/code-runner.ts`) и зарегистрируйте его в `provideCodeRunners()`.

Остальной код менять не нужно: TypeScript подсветит все места, где новый язык ещё не обработан.
