Файлы объявлений `.d.ts` содержат только типы — без реализации. Через них TypeScript узнаёт о типах JavaScript-библиотек, глобальных переменных и нестандартных модулях (например, импорте `.svg` или `.md`). Умение написать `.d.ts` нужно, когда библиотека не поставляет типы или вы расширяете чужие.

## Откуда берутся типы

1. **Встроены в пакет** — поле `types` (или `exports` с условием `types`) в `package.json` указывает на `.d.ts`. Так поставляются Angular, RxJS, большинство современных библиотек.
2. **DefinitelyTyped** — сообщество поддерживает пакеты `@types/имя`: `@types/node`, `@types/lodash`.
3. **Собственные** — файл `.d.ts` в вашем проекте.

```bash
npm install -D @types/lodash-es
```

> [!NOTE]
> В TypeScript 6 `@types/*` больше не подключаются автоматически: перечислите нужные в `compilerOptions.types` (например, `"types": ["node"]`). Angular-проекты давно указывают `types` явно — в `tsconfig.app.json` стоит пустой массив, а в `tsconfig.spec.json` — `vitest/globals`.

## declare: описать то, что уже существует

```ts
// globals.d.ts
declare const APP_VERSION: string; // подставляется сборщиком через define
declare function gtag(command: 'event', name: string, params?: Record<string, unknown>): void;
```

`declare` сообщает компилятору: «это есть в рантайме, поверь». Никакого кода не генерируется.

## Расширение глобального объекта

```ts
// window.d.ts
export {}; // делает файл модулем — нужно для declare global

declare global {
  interface Window {
    dataLayer: unknown[];
    __APP_STATE__?: Record<string, unknown>;
  }
}

// теперь в любом файле:
window.dataLayer.push({ event: 'login' });
```

Работает благодаря слиянию интерфейсов (declaration merging) — поэтому глобальные типы браузера описаны как `interface`.

## Модули без типов

Если пакет не имеет типов, самое быстрое — объявить его как `any`-модуль:

```ts
// vendor.d.ts
declare module 'legacy-charts'; // всё из модуля — any
```

Лучше описать хотя бы используемую часть:

```ts
declare module 'legacy-charts' {
  export type ChartOptions = { type: 'line' | 'bar'; data: number[] };
  export function render(element: HTMLElement, options: ChartOptions): () => void;
}
```

## Импорт файлов-ресурсов

```ts
// assets.d.ts
declare module '*.svg' {
  const url: string;
  export default url;
}

declare module '*.md' {
  const content: string;
  export default content;
}
```

После этого `import logo from './logo.svg'` компилируется. Сам импорт должен поддерживать сборщик: в Angular CLI для этого есть опция `loader` в `angular.json` (`".svg": "file"`, `".md": "text"`).

## Module augmentation: расширение чужих типов

Можно добавить поля в интерфейс внутри стороннего модуля:

```ts
// router-data.d.ts
import '@angular/router';

declare module '@angular/router' {
  interface Route {
    // пример: строго типизированные метаданные маршрута в своём проекте
    analyticsId?: string;
  }
}
```

Расширять можно только `interface` (не `type`) и только то, что модуль экспортирует.

## Генерация .d.ts для своей библиотеки

```jsonc
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true, // переход к исходнику .ts из IDE
    "emitDeclarationOnly": true // если JS собирает другой инструмент
  }
}
```

Angular-библиотеки собираются `ng-packagr`, который генерирует `.d.ts` и формат APF (Angular Package Format) автоматически.

### isolatedDeclarations

С TypeScript 5.5 флаг `isolatedDeclarations` требует явных типов у экспортов, чтобы `.d.ts` можно было генерировать по одному файлу без полной проверки типов — это ускоряет сборку больших монорепозиториев (инструменты вроде oxc и swc генерируют объявления параллельно).

```ts
export const add = (a: number, b: number): number => a + b; // тип возврата явный — ок
export const bad = (a: number) => a * 2; // ошибка под isolatedDeclarations
```

## Тройной слеш

Директивы `/// <reference ... />` подключают объявления вручную. Сегодня они нужны редко — например, в файлах воркеров:

```ts
/// <reference lib="webworker" />
```

Такая директива есть в песочнице этой платформы: она сообщает компилятору, что в файле доступны API воркера (`postMessage`, `self`), а не DOM.

## Коротко

- `.d.ts` содержит только типы; источники — пакет, `@types/*`, свои файлы.
- `declare` описывает существующее в рантайме, ничего не генерируя.
- `declare global` + `interface Window` — расширение глобальных типов.
- `declare module 'x'` — типы для пакетов без типов и для импорта ресурсов.
- Module augmentation расширяет интерфейсы чужих модулей.
