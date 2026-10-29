Promise — объект, представляющий результат асинхронной операции, которого ещё нет. `async/await` — синтаксис поверх промисов, позволяющий писать асинхронный код как синхронный. В Angular основной инструмент асинхронности — RxJS, но промисы встречаются повсюду: `fetch`, `import()`, `firstValueFrom`, ресурсы, тесты.

## Состояния промиса

```text
          resolve(value)
pending ─────────────────▶ fulfilled (value)
   │
   └──────────────────────▶ rejected (reason)
          reject(error) / throw
```

Промис **оседает** (settles) один раз. Повторные `resolve`/`reject` игнорируются.

```js
const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(`прошло ${ms} мс`), ms);
  });

delay(300).then((message) => console.log(message));
```

> [!NOTE]
> Функция-executor, переданная в `new Promise`, выполняется **синхронно**. Асинхронны только колбэки `then`/`catch`/`finally` — они всегда идут через очередь микрозадач, даже если промис уже выполнен.

## Цепочки

`then` всегда возвращает **новый** промис. Значение, возвращённое из колбэка, становится результатом следующего звена; если вернуть промис, цепочка подождёт его.

```js
fetch('/api/user')
  .then((response) => response.json()) // возвращает промис — цепочка ждёт
  .then((user) => fetch(`/api/orders?user=${user.id}`))
  .then((response) => response.json())
  .then((orders) => console.log(orders))
  .catch((error) => console.error('Что-то пошло не так', error))
  .finally(() => hideSpinner());
```

Типичная ошибка — забыть `return` внутри `then`: следующее звено получит `undefined` и не будет ждать операцию.

## Обработка ошибок

- `throw` внутри `then` превращает промис в rejected.
- `catch` ловит ошибки всех звеньев **выше** него и возвращает fulfilled-промис (если сам не бросил ошибку).
- Необработанный rejected-промис вызывает событие `unhandledrejection` (в Node.js по умолчанию завершает процесс).

```js
Promise.reject(new Error('сбой'))
  .then(() => console.log('не выполнится'))
  .catch((error) => {
    console.log(error.message); // 'сбой'
    return 'восстановились';
  })
  .then((value) => console.log(value)); // 'восстановились'
```

> [!WARNING]
> `fetch` не отклоняет промис при HTTP 404 или 500 — только при сетевой ошибке. Проверяйте `response.ok`. В Angular `HttpClient` наоборот превращает ответы 4xx/5xx в ошибку потока.

## async/await

```ts
async function loadDashboard(userId: string): Promise<Dashboard> {
  try {
    const user = await api.getUser(userId);
    const orders = await api.getOrders(user.id);
    return { user, orders };
  } catch (error) {
    reportError(error);
    throw error; // пробрасываем дальше, если не можем обработать
  }
}
```

- `async`-функция всегда возвращает промис.
- `await` приостанавливает функцию до оседания промиса и возвращает значение или бросает ошибку.
- `try/catch` работает для `await` так же, как для синхронного кода.

### Последовательно против параллельно

```ts
// Последовательно: 2 запроса × 300 мс = ~600 мс
const user = await api.getUser(id);
const settings = await api.getSettings(id);

// Параллельно: ~300 мс — запросы независимы
const [user2, settings2] = await Promise.all([api.getUser(id), api.getSettings(id)]);
```

> [!TIP]
> `await` в цикле `for` выполняет итерации последовательно. Если операции независимы, соберите промисы и дождитесь их через `Promise.all`. Если их тысячи — ограничьте параллельность (пул или `mergeMap(fn, concurrency)` в RxJS).

## Комбинаторы

| Метод | Разрешается | Отклоняется | Когда использовать |
| --- | --- | --- | --- |
| `Promise.all` | когда все выполнены, массив результатов | при первой ошибке | всё нужно для продолжения |
| `Promise.allSettled` | когда все осели, массив `{status, value/reason}` | никогда | нужны итоги каждой операции |
| `Promise.race` | первым осевшим (успех или ошибка) | первым осевшим | таймауты |
| `Promise.any` | первым успешным | если все упали (`AggregateError`) | зеркала, резервные источники |

```js
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
```

## Отмена: AbortController

Промисы нельзя отменить сами по себе. Стандартный механизм отмены — `AbortSignal`:

```ts
const controller = new AbortController();

fetch('/api/search?q=angular', { signal: controller.signal })
  .then((r) => r.json())
  .catch((error) => {
    if (error.name === 'AbortError') return; // отменено намеренно
    throw error;
  });

controller.abort(); // например, пользователь ввёл новый запрос

// Готовые сигналы
fetch('/api/slow', { signal: AbortSignal.timeout(5000) });
fetch('/api/x', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) });
```

В RxJS отмена встроена: отписка от `HttpClient`-потока прерывает запрос, а `switchMap` делает это автоматически.

## Promise.withResolvers

ES2024 добавил удобный способ получить промис и его функции управления «снаружи»:

```js
const { promise, resolve, reject } = Promise.withResolvers();
socket.onmessage = (event) => resolve(event.data);
socket.onerror = reject;
await promise;
```

## Промисы и Observable

| | Promise | Observable |
| --- | --- | --- |
| Значений | одно | ноль, одно или много |
| Выполнение | жадное — начинается сразу | ленивое — при подписке |
| Отмена | нет (только через AbortSignal) | отписка |
| Операторы | `then/catch` | сотни операторов |

Переход между мирами: `from(promise)` и `firstValueFrom(observable$)` / `lastValueFrom`.

## Реализуем Promise.all

Классическая задача, которую стоит уметь писать с нуля:

```js
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value; // сохраняем порядок, а не порядок завершения
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);
    });
  });
}
```

Попробуйте сами в разделе [практики](/practice/js-promise-all).

## Коротко

- Промис оседает один раз: fulfilled или rejected.
- Executor синхронен, колбэки — микрозадачи.
- Каждый `then` возвращает новый промис; не забывайте `return`.
- Независимые операции — через `Promise.all`, а не `await` подряд.
- Отмена — `AbortController`; таймаут — `AbortSignal.timeout` или `Promise.race`.
