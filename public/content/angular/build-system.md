Сборка Angular-проекта прошла путь от собственной конфигурации Webpack до связки **esbuild + Vite**. Этот урок — краткий обзор с точки зрения Angular; подробно о сборщиках — в треке [Сборка и монорепозитории](/tracks/tooling/angular-builders).

## Что делает `ng build`

```text
angular.json → builder "@angular/build:application"
  1. Компилятор Angular: шаблоны → инструкции Ivy, проверка типов (TypeScript + шаблоны)
  2. esbuild: транспиляция TS, бандлинг, code splitting по import(), минификация
  3. Стили: CSS/Sass, Tailwind через PostCSS, инлайнинг критического CSS
  4. Оптимизация чанков, хеши в именах файлов, генерация index.html
  5. (опционально) SSR-бандл и пререндер страниц
→ dist/<project>/browser (+ server)
```

`ng serve` использует тот же конвейер, но раздаёт результат через **dev-сервер Vite** с HMR (горячей заменой модулей) для стилей и шаблонов.

## Почему Angular ушёл с Webpack

До Angular 16 сборку выполнял `@angular-devkit/build-angular:browser` на Webpack. Проблемы:

- **Скорость**: большие проекты собирались минутами, пересборка в режиме разработки — секундами. Webpack и его загрузчики написаны на JavaScript и плохо параллелятся.
- **Сложность**: десятки плагинов и загрузчиков, тонкие настройки, которые CLI прятал за `angular.json`.
- **Устаревающая модель**: экосистема переходила на нативные ES-модули и инструменты на Go/Rust.

Новый builder `application`:

- **esbuild** (Go) выполняет транспиляцию и бандлинг в разы быстрее; кеширование компилятора Angular ускоряет инкрементальные пересборки.
- **Vite** даёт быстрый dev-сервер и HMR.
- Единый builder для браузера, SSR и пререндера вместо нескольких.
- Стал стандартом для новых проектов в Angular 17 и рекомендуемой целью миграции (`ng update` предлагает её автоматически).

> [!NOTE]
> В текущих версиях Angular CLI используются esbuild для сборки, Vite 8 для dev-сервера, а Rolldown (бандлер на Rust, на котором построен Vite 8) применяется для оптимизации чанков. Тест-раннер `ng test` построен на Vitest — тоже из экосистемы Vite.

## Что потеряли

- **Кастомный Webpack-конфиг** больше нельзя подключить. Если проект зависел от плагинов Webpack (Module Federation, специфичные загрузчики), нужно искать альтернативы: [Native Federation](/tracks/tooling/native-federation), плагины esbuild, опция `loader` в `angular.json`.
- Некоторые сторонние builder-ы (например, `@angular-builders/custom-webpack`) несовместимы с новым конвейером.

## Полезные настройки angular.json

```jsonc
{
  "builder": "@angular/build:application",
  "options": {
    "browser": "src/main.ts",
    "styles": ["src/styles.css"],
    "loader": { ".svg": "text", ".md": "text" }, // импорт файлов как строк
    "define": { "APP_VERSION": "'1.4.2'" }, // константы времени сборки
    "allowedCommonJsDependencies": ["some-cjs-lib"],
    "webWorkerTsConfig": "tsconfig.worker.json"
  },
  "configurations": {
    "production": {
      "budgets": [{ "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" }],
      "outputHashing": "all"
    }
  }
}
```

На этой платформе через `webWorkerTsConfig` собирается песочница для практики — отдельный бандл Web Worker с RxJS и транспайлером TypeScript.

> [!INTERVIEW]
> «Почему Angular перешёл с Webpack на esbuild/Vite?» — Ради скорости и простоты: esbuild на Go собирает в разы быстрее, Vite даёт быстрый dev-сервер с HMR, а единый application builder покрывает браузер, SSR и пререндер. Цена — нельзя расширять сборку Webpack-конфигом, поэтому решения вроде Module Federation заменяются на Native Federation и плагины esbuild.

## Коротко

- `ng build` = компилятор Angular + esbuild; `ng serve` = тот же конвейер + dev-сервер Vite.
- Переход с Webpack дал многократное ускорение и единый builder для SSR.
- Потеряна возможность кастомного Webpack-конфига.
- `loader`, `define`, `budgets`, `allowedCommonJsDependencies` — частые настройки.
