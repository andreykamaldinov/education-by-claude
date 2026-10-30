JavaScript в странице работает в одном главном потоке, который заодно отвечает за рендеринг и ввод. Воркеры дают дополнительные потоки: **Web Worker** — для вычислений, **Service Worker** — для перехвата сетевых запросов и офлайн-режима.

## Web Worker

Отдельный поток со своим event loop, без доступа к DOM. Общение с главным потоком — сообщениями.

```ts
// app.component.ts
const worker = new Worker(new URL('./report.worker', import.meta.url), { type: 'module' });

worker.onmessage = ({ data }) => this.report.set(data);
worker.postMessage({ rows: hugeArray, groupBy: 'region' });
```

```ts
// report.worker.ts
/// <reference lib="webworker" />
addEventListener('message', ({ data }) => {
  const result = aggregate(data.rows, data.groupBy); // тяжёлые вычисления не блокируют UI
  postMessage(result);
});
```

В Angular: `ng generate web-worker report` создаст файл воркера и настроит `tsconfig.worker.json`. Сборщик выделит воркер в отдельный бандл.

### Что доступно в воркере

Есть: `fetch`, `WebSocket`, `IndexedDB`, `setTimeout`, `crypto`, `OffscreenCanvas`, `importScripts`/ES-модули.
Нет: `document`, `window`, DOM, `localStorage`.

### Передача данных

`postMessage` копирует данные алгоритмом **structured clone** (как `structuredClone`). Для больших бинарных данных копирование дорого — используйте **transferable** объекты, которые передаются без копирования (владение переходит к получателю):

```ts
const buffer = new ArrayBuffer(50_000_000);
worker.postMessage(buffer, [buffer]); // после этого buffer в главном потоке пуст (byteLength = 0)
```

### Когда использовать

- Обработка больших массивов: фильтрация, сортировка, агрегация для таблиц и графиков.
- Парсинг тяжёлых форматов (CSV, Excel, Markdown для огромных документов).
- Криптография, сжатие, обработка изображений (через `OffscreenCanvas`).
- Выполнение недоверенного пользовательского кода в изоляции от DOM.

Именно в Web Worker на этой платформе выполняется код из раздела практики: бесконечный цикл в решении не подвесит страницу — главный поток просто завершит воркер по таймауту (`worker.terminate()`).

> [!NOTE]
> Воркер — не полноценная песочница безопасности: он работает на том же origin и может делать `fetch` с cookies сайта. Для действительно недоверенного кода нужен изолированный origin (iframe с `sandbox` на отдельном домене).

### Comlink: воркер как объект

Библиотека Comlink оборачивает `postMessage` в прокси, и вызовы выглядят как обычные асинхронные методы:

```ts
// worker
expose({ aggregate: (rows: Row[]) => heavyAggregate(rows) });

// main
const api = wrap<{ aggregate(rows: Row[]): Result }>(worker);
const result = await api.aggregate(rows);
```

## Service Worker

Скрипт, который браузер запускает отдельно от страницы. Он работает как **прокси между приложением и сетью**: перехватывает запросы, отвечает из кеша, получает push-уведомления, выполняет фоновую синхронизацию.

```text
Страница ──fetch──▶ Service Worker ──▶ кеш (Cache API)
                                  └──▶ сеть
```

### Жизненный цикл

1. **Регистрация** — `navigator.serviceWorker.register('/sw.js')`.
2. **Install** — кешируем статические ресурсы.
3. **Waiting** — новая версия ждёт, пока закроются вкладки со старой.
4. **Activate** — удаляем старые кеши.
5. **Fetch** — перехват запросов.

```js
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('v2').then((cache) => cache.addAll(['/', '/main.js'])));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
```

### Стратегии кеширования

| Стратегия | Как | Для чего |
| --- | --- | --- |
| Cache first | кеш, иначе сеть | статика с хешем в имени, шрифты |
| Network first | сеть, при ошибке — кеш | API с данными, где важна свежесть |
| Stale-while-revalidate | отдать кеш, параллельно обновить | аватары, справочники |
| Network only | только сеть | платежи, аналитика |

### Angular Service Worker

`ng add @angular/pwa` добавляет `@angular/service-worker`, манифест и `ngsw-config.json` с декларативными правилами кеширования ассетов и API. Сервис `SwUpdate` сообщает о новой версии приложения:

```ts
inject(SwUpdate)
  .versionUpdates.pipe(filter((e) => e.type === 'VERSION_READY'), takeUntilDestroyed())
  .subscribe(() => this.showReloadPrompt());
```

> [!WARNING]
> Service Worker требует HTTPS (кроме localhost) и может «застрять» со старой версией у пользователей, если неправильно настроить кеширование `index.html`. Тестируйте обновление версии до релиза.

## Shared Worker и Worklets

- **SharedWorker** — один воркер на несколько вкладок одного origin (общее WebSocket-соединение).
- **Worklets** (Audio, Paint, Animation) — лёгкие специализированные потоки для конвейера рендеринга и звука.

> [!INTERVIEW]
> «Чем Web Worker отличается от Service Worker?» — Web Worker — фоновый поток для вычислений, принадлежит странице, общается с ней через `postMessage`, не имеет доступа к DOM. Service Worker — событийный прокси между приложением и сетью, живёт независимо от страниц, перехватывает `fetch`, работает с Cache API, push-уведомлениями и фоновой синхронизацией; основа PWA и офлайн-режима.

## Коротко

- Web Worker — вычисления вне главного потока; общение через `postMessage`.
- Большие бинарные данные передавайте как transferable.
- Service Worker — прокси для сети: кеширование, офлайн, push.
- Стратегии кеширования: cache first, network first, stale-while-revalidate.
- `@angular/pwa` и `SwUpdate` — готовая интеграция в Angular.
