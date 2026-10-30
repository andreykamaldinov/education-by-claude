Модуль — файл со своей областью видимости, который явно объявляет, что он экспортирует и что импортирует. В JavaScript исторически было несколько систем модулей; сегодня стандарт — **ES Modules (ESM)**, но CommonJS (CJS) по-прежнему живёт в Node.js и в старых npm-пакетах.

## ES Modules

```js
// math.js
export const PI = 3.14159;
export function area(r) {
  return PI * r * r;
}
export default class Calculator {}

// app.js
import Calculator, { PI, area as circleArea } from './math.js';
import * as math from './math.js';
```

Свойства ESM:

- **Статическая структура.** `import` и `export` только на верхнем уровне, пути — строковые литералы. Сборщик знает граф зависимостей без выполнения кода → возможен **tree-shaking**.
- **Strict mode** по умолчанию, `this` на верхнем уровне — `undefined`.
- **Своя область видимости**: переменные модуля не попадают в `window`.
- **Выполняется один раз**, при повторных импортах возвращается тот же экземпляр модуля. На этом держатся модульные синглтоны.
- **Асинхронная загрузка** в браузере (`<script type="module">` ведёт себя как `defer`).

## Живые привязки (live bindings)

Импорт в ESM — не копия значения, а **ссылка на переменную** экспортирующего модуля:

```js
// counter.js
export let count = 0;
export function increment() {
  count++;
}

// app.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 — видим актуальное значение
count = 5; // TypeError: импорт доступен только для чтения
```

В CommonJS `require` возвращает объект `module.exports`; деструктурированное значение — копия на момент импорта.

## CommonJS

```js
// math.cjs
const PI = 3.14159;
module.exports = { PI, area: (r) => PI * r * r };

// app.cjs
const { area } = require('./math.cjs');
```

| | ESM | CommonJS |
| --- | --- | --- |
| Синтаксис | `import` / `export` | `require` / `module.exports` |
| Загрузка | асинхронная, статический анализ | синхронная, во время выполнения |
| Привязки | живые | копия значения |
| Tree-shaking | да | практически нет |
| Top-level await | да | нет |
| Где | браузер, современный Node.js, бандлеры | Node.js, старые пакеты |

> [!NOTE]
> Angular CLI выводит предупреждение «CommonJS or AMD dependencies can cause optimization bailouts», когда пакет поставляется в CJS: такой код не удаётся эффективно tree-shake'ить. Его можно заглушить через `allowedCommonJsDependencies`, но правильнее искать ESM-альтернативу.

## Динамический import()

`import()` загружает модуль во время выполнения и возвращает промис. Сборщики выносят такой модуль в отдельный чанк — это основа **ленивой загрузки**.

```ts
// Ленивый маршрут Angular
{
  path: 'admin',
  loadComponent: () => import('./admin/admin-page').then((m) => m.AdminPage),
}

// Загрузка тяжёлой библиотеки по требованию
async function exportToPdf(data: Report) {
  const { jsPDF } = await import('jspdf');
  return new jsPDF().text(data.title, 10, 10);
}
```

## Top-level await

В ESM можно использовать `await` на верхнем уровне модуля. Модули, импортирующие его, будут ждать завершения:

```js
// config.js
const response = await fetch('/config.json');
export const config = await response.json();
```

Удобно, но блокирует выполнение всего графа зависимостей — не злоупотребляйте в коде, который грузится при старте приложения.

## Циклические зависимости

Если `a.js` импортирует `b.js`, а `b.js` — `a.js`, один из модулей увидит другой недоинициализированным:

```js
// a.js
import { b } from './b.js';
export const a = 'A';
console.log(b);

// b.js
import { a } from './a.js';
export const b = 'B';
console.log(a); // ReferenceError: Cannot access 'a' before initialization (TDZ)
```

> [!WARNING]
> Циклы часто возникают через barrel-файлы (`index.ts`, реэкспортирующий всю папку). В Angular это проявляется ошибками вида «Cannot access X before initialization» или `undefined` в провайдерах. Лечится выносом общего кода в отдельный модуль и импортом напрямую, а не через barrel.

## Tree-shaking

Сборщик удаляет экспорты, которые никто не импортировал. Чтобы это работало:

- используйте ESM-сборки зависимостей;
- импортируйте точечно: `import { debounce } from 'lodash-es'`, а не `import _ from 'lodash'`;
- избегайте побочных эффектов на верхнем уровне модуля; пакеты помечают отсутствие эффектов полем `"sideEffects": false` в `package.json`;
- в Angular `providedIn: 'root'` делает сервис tree-shakable: если его никто не инжектит, он не попадёт в бандл.

## Модули в Node.js

Node.js определяет систему модулей по расширению и полю `type`:

- `.mjs` — всегда ESM, `.cjs` — всегда CJS;
- `.js` — ESM, если в ближайшем `package.json` указано `"type": "module"`, иначе CJS.

Поле `exports` в `package.json` задаёт публичные точки входа пакета и условные экспорты для `import`/`require`/`browser`. Импорт файла, не указанного в `exports`, запрещён — так пакеты прячут внутренности.

## Import maps

Браузеры умеют сопоставлять «голые» имена с URL без сборщика:

```html
<script type="importmap">
  {
    "imports": {
      "rxjs": "https://cdn.example.com/rxjs@7.8.2/dist/esm/index.js"
    }
  }
</script>
<script type="module">
  import { of } from 'rxjs';
</script>
```

На import maps построена [Native Federation](/tracks/tooling/native-federation).

## Коротко

- ESM — стандарт: статические `import/export`, живые привязки, tree-shaking.
- CommonJS — синхронный `require`, копии значений, не дружит с tree-shaking.
- `import()` — динамическая загрузка и код-сплиттинг.
- Модуль выполняется один раз; циклы ведут к TDZ-ошибкам.
- Точечные импорты и отсутствие побочных эффектов уменьшают бандл.
