Angular CLI скрывает сборку за командами `ng serve` и `ng build`, но под капотом за десять лет сменилось несколько поколений инструментов. Вопрос «почему Angular перешёл на esbuild и Vite» встречается на собеседованиях, а понимание текущего конвейера помогает при миграциях и оптимизации.

## Что такое builder

Builder — функция, которую вызывает Angular CLI для задачи (`build`, `serve`, `test`), указанная в `angular.json`:

```json
"architect": {
  "build": { "builder": "@angular/build:application", "options": { ... } },
  "serve": { "builder": "@angular/build:dev-server" },
  "test": { "builder": "@angular/build:unit-test" }
}
```

Builder можно заменить на сторонний (например, из Nx или `@angular-architects/native-federation`) — так расширяется сборка.

## История

| Период | Builder | Инструменты |
| --- | --- | --- |
| Angular 2–16 | `@angular-devkit/build-angular:browser` | Webpack, Terser, Babel |
| Angular 16 (preview) | `browser-esbuild` | esbuild вместо Webpack для сборки |
| Angular 17 | `application` — по умолчанию для новых проектов | esbuild + Vite dev-сервер, единый builder для SSR |
| Angular 18–19 | пакет `@angular/build` (без зависимостей Webpack) для новых проектов | HMR стилей и шаблонов |
| Angular 21 | `unit-test` на Vitest по умолчанию | Vitest вместо Karma/Jasmine |
| Сейчас (22) | `@angular/build:application` | esbuild, Vite 8, Rolldown для оптимизации чанков |

## Почему ушли с Webpack

### Скорость

Это главная причина. На реальных проектах переход дал многократное ускорение:

- production-сборка заметно быстрее: при запуске в Angular 17 команда сообщала об ускорении до 67% для клиентских приложений и до 87% для приложений с SSR;
- старт dev-сервера и пересборки — в разы быстрее;
- HMR без полной пересборки чанков.

esbuild написан на Go и использует все ядра процессора; Webpack с JS-loaders упирается в один поток.

### Упрощение

- Один builder `application` для браузера, SSR и пререндера вместо отдельных `browser`, `server`, `prerender`, `app-shell`.
- Меньше зависимостей (Webpack, десятки loaders и плагинов, Babel) — меньше уязвимостей и конфликтов версий.
- ESM как основной формат вывода: нативные `import()` для ленивых чанков, без рантайма Webpack.

### Соответствие экосистеме

Индустрия переходит на нативные инструменты (Go/Rust) и Vite. Angular получил совместимость с этой экосистемой: Vitest, плагины, привычный dev-опыт.

## Как устроен конвейер сейчас

```text
ng build
  ├── компилятор Angular (ngtsc): шаблоны → инструкции Ivy, проверка типов TS и шаблонов
  │      (параллельно, с кешем между сборками)
  ├── esbuild: бандлинг, code splitting, минификация, tree-shaking
  ├── стили: Sass/Less/PostCSS (Tailwind), критический CSS
  ├── оптимизация чанков (Rolldown), хеши, index.html, бюджеты
  └── SSR-бандл и пререндер (если включено)

ng serve
  └── тот же конвейер + dev-сервер Vite (раздача, HMR, prebundling зависимостей)
```

> [!NOTE]
> Компилятор Angular и esbuild работают вместе через плагин: esbuild не умеет компилировать шаблоны и проверять типы, поэтому этим занимается компилятор Angular, а esbuild получает готовый JavaScript.

## Что пришлось отдать

| Было в Webpack-мире | Сейчас |
| --- | --- |
| кастомный `webpack.config.js` через `custom-webpack` | нет; расширение — плагинами esbuild (через сторонние builders) и опциями `angular.json` |
| Module Federation (Webpack) | Native Federation или Module Federation 2.0 со сторонними инструментами |
| специфичные loaders | опция `loader` (`text`, `file`, `binary`, `base64`, `dataurl`, `empty`) |
| `require.context` и подобные Webpack-API | обычные ES-импорты, `import.meta.glob` недоступен — явные карты импортов |
| CommonJS «как есть» | работает, но с предупреждением и хуже оптимизируется |

## Миграция существующего проекта

```bash
ng update @angular/cli --name use-application-builder
```

Схематик меняет builder в `angular.json`, переименовывает опции (`main` → `browser`), переносит настройки SSR. Типичные проблемы:

- код, обращающийся к `require` или Webpack-специфичным API;
- импорты стилей с `~` (Webpack-синтаксис для `node_modules`);
- сторонние библиотеки с CommonJS и глобальными побочными эффектами;
- кастомный Webpack-конфиг — нужно найти замену каждой возможности.

## Типичные настройки application builder

```jsonc
{
  "browser": "src/main.ts",
  "server": "src/main.server.ts", // SSR
  "outputMode": "server", // или "static" для чистого пререндера/CSR
  "loader": { ".md": "text" },
  "define": { "BUILD_TIME": "'2026-10-29'" },
  "externalDependencies": [],
  "allowedCommonJsDependencies": [],
  "security": { "autoCsp": true },
  "subresourceIntegrity": true
}
```

> [!INTERVIEW]
> «Почему Angular перешёл с Webpack на esbuild и Vite?» — Главная причина — скорость: esbuild на Go в разы быстрее Webpack с JS-loaders, Vite даёт мгновенный dev-сервер и HMR. Плюс упрощение: единый builder `application` для браузера, SSR и пререндера, меньше зависимостей, ESM-вывод без рантайма Webpack, совместимость с экосистемой Vite (Vitest). Цена — невозможность расширять сборку Webpack-конфигом: Module Federation заменяется Native Federation, специфичные loaders — опцией `loader` и плагинами esbuild.

## Коротко

- Builder — функция CLI для задачи, указанная в `angular.json`.
- Webpack → esbuild (сборка) + Vite (dev-сервер) с Angular 17; `@angular/build` без Webpack.
- Причины: скорость, единый builder, меньше зависимостей, экосистема Vite.
- Потеряны кастомные Webpack-конфиги и Webpack Module Federation.
- Миграция — схематик `use-application-builder` и замена Webpack-специфики.
