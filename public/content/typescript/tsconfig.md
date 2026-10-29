`tsconfig.json` определяет, насколько строго TypeScript проверяет код и как он понимает модули. Настройки по умолчанию в новых Angular-проектах уже разумные, но знать, что за ними стоит, нужно и для собеседования, и для миграции старых проектов.

## Строгость

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

`strict: true` включает группу флагов:

| Флаг | Что ловит |
| --- | --- |
| `strictNullChecks` | `null`/`undefined` не входят в другие типы; `user.name` при `user: User \| null` — ошибка |
| `noImplicitAny` | параметр без типа, который нельзя вывести |
| `strictFunctionTypes` | контравариантная проверка параметров функций |
| `strictBindCallApply` | типизация `bind`, `call`, `apply` |
| `strictPropertyInitialization` | поле класса без инициализации |
| `useUnknownInCatchVariables` | `catch (e)` — `e: unknown`, а не `any` |
| `alwaysStrict` | `'use strict'` в каждом файле |
| `noImplicitThis` | `this` с неявным типом `any` |

### noUncheckedIndexedAccess

```ts
const users: User[] = [];
const first = users[0]; // с флагом: User | undefined
first.name; // ошибка — массив мог быть пуст

const dict: Record<string, number> = {};
dict['key'].toFixed(); // ошибка — ключа может не быть
```

Не входит в `strict`, но закрывает самую частую дыру: доступ по индексу.

### exactOptionalPropertyTypes

```ts
type Options = { timeout?: number };
const o: Options = { timeout: undefined }; // с флагом — ошибка
```

Различает «поле отсутствует» и «поле есть со значением `undefined`». Важно для `Object.keys`, spread и PATCH-запросов.

## Angular-специфичные проверки

```jsonc
{
  "angularCompilerOptions": {
    "strictTemplates": true, // полная проверка типов в шаблонах
    "strictInjectionParameters": true, // ошибка, если DI не может определить зависимость
    "strictInputAccessModifiers": true, // нельзя биндить private/readonly input
    "typeCheckHostBindings": true, // проверка host-биндингов
    "extendedDiagnostics": {
      "checks": { "optionalChainNotNullable": "error" }
    }
  }
}
```

`strictTemplates` проверяет, что вы передаёте в `[input]` значения правильного типа, что в `(output)` обработчик принимает тип события, что `@if (x; as y)` сужает тип.

## Модули и разрешение путей

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "preserve", // оставить import/export как есть — сборщик сам разберётся
    "moduleResolution": "bundler", // как ищутся модули: по правилам бандлеров (exports, без расширений)
    "isolatedModules": true, // каждый файл компилируется независимо (нужно esbuild/Vite)
    "verbatimModuleSyntax": true, // import type удаляется, обычный import — сохраняется как есть
    "lib": ["ES2022", "DOM"]
  }
}
```

| `moduleResolution` | Для чего |
| --- | --- |
| `bundler` | приложения, собираемые Vite/esbuild/webpack |
| `nodenext` | код, запускаемый Node.js напрямую, и npm-библиотеки |
| `node10` (`node`) | устаревший, для старых проектов |

### isolatedModules и import type

esbuild и Vite транспилируют каждый файл отдельно, не зная о типах в других файлах. Поэтому реэкспорт типа нужно пометить:

```ts
export type { User } from './user.model'; // иначе компилятор файла не знает, что User — только тип
import { type User, createUser } from './user';
```

## Алиасы путей

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"]
    }
  }
}
```

Angular CLI учитывает `paths` при сборке. В Nx-монорепозитории алиасы библиотек (`@org/feature-cart`) генерируются в `tsconfig.base.json` автоматически.

> [!WARNING]
> `paths` — только подсказка компилятору TypeScript. Если код запускается Node.js без бандлера, алиасы нужно отдельно настроить (например, через поле `imports` в `package.json`), иначе импорты не найдутся в рантайме.

## Project references и несколько конфигураций

Angular-проект содержит несколько `tsconfig`:

- `tsconfig.json` — базовые настройки и ссылки на остальные;
- `tsconfig.app.json` — код приложения (без тестов);
- `tsconfig.spec.json` — тесты (добавляет типы `vitest/globals` или `jasmine`);
- `tsconfig.worker.json` — веб-воркеры с `lib: ["webworker"]` (есть и в этом проекте).

`references` + `composite: true` позволяют собирать части проекта инкрементально (`tsc --build`).

## Постепенное включение строгости

Миграция большого проекта на `strict`:

1. Включить флаги по одному, начиная с `noImplicitAny` и `strictNullChecks`.
2. Временно подавлять ошибки комментариями `// @ts-expect-error` с пояснением (в отличие от `@ts-ignore`, он сам станет ошибкой, когда проблема исчезнет).
3. Для огромных кодовых баз — плагины вроде `typescript-strict-plugin`, позволяющие включить строгость пофайлово.

## Коротко

- `strict` — минимум; добавьте `noUncheckedIndexedAccess` и `exactOptionalPropertyTypes`.
- В Angular обязательно `strictTemplates`.
- `moduleResolution: "bundler"`, `isolatedModules` и `import type` — стандарт для esbuild/Vite.
- `paths` — алиасы для компилятора и сборщика, не для голого Node.js.
- Строгость включают постепенно, с `@ts-expect-error` вместо `@ts-ignore`.
