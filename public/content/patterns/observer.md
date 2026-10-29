**Observer** (наблюдатель) определяет зависимость «один ко многим»: когда объект-субъект меняется, все подписчики автоматически получают уведомление. Это основа событийной модели браузера, RxJS, сигналов Angular и outputs компонентов.

## Классическая реализация

```ts
type Listener<T> = (value: T) => void;

export class Observable<T> {
  readonly #listeners = new Set<Listener<T>>();

  subscribe(listener: Listener<T>): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener); // функция отписки
  }

  protected notify(value: T): void {
    this.#listeners.forEach((listener) => listener(value));
  }
}

class StockTicker extends Observable<{ symbol: string; price: number }> {
  update(symbol: string, price: number) {
    this.notify({ symbol, price });
  }
}

const ticker = new StockTicker();
const unsubscribe = ticker.subscribe(({ symbol, price }) => console.log(symbol, price));
ticker.update('YNDX', 4210);
unsubscribe();
```

Субъект не знает, кто подписчики и что они делают, — слабая связь между отправителем и получателями.

## Типизированный EventEmitter

```ts
type Events = {
  login: { userId: string };
  logout: void;
  error: Error;
};

export class TypedEmitter<E extends Record<string, unknown>> {
  readonly #handlers = new Map<keyof E, Set<(payload: never) => void>>();

  on<K extends keyof E>(event: K, handler: (payload: E[K]) => void): () => void {
    const set = this.#handlers.get(event) ?? new Set();
    set.add(handler);
    this.#handlers.set(event, set);
    return () => set.delete(handler);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    this.#handlers.get(event)?.forEach((handler) => (handler as (p: E[K]) => void)(payload));
  }
}
```

Такой emitter вы реализуете в разделе [практики](/practice/ts-typed-emitter).

## Push и pull

| Модель | Как | Примеры |
| --- | --- | --- |
| **Push** | субъект отправляет данные в уведомлении | DOM-события, RxJS, outputs |
| **Pull** | уведомление «что-то изменилось», данные подписчик читает сам | сигналы Angular: зависимые `computed` помечаются грязными и пересчитываются при чтении |

Pull-модель сигналов позволяет не вычислять то, что никто не читает, и избегать промежуточных несогласованных состояний («глитчей»).

## Observer во фронтенде

| Механизм | Субъект | Подписка | Отписка |
| --- | --- | --- | --- |
| DOM-события | элемент | `addEventListener` | `removeEventListener` / `AbortSignal` |
| RxJS | `Observable` / `Subject` | `subscribe` | `unsubscribe`, `takeUntilDestroyed` |
| Angular Signals | `signal` | чтение в `computed`/`effect`/шаблоне | автоматически |
| Angular outputs | `output()` | `(event)` в шаблоне | автоматически с view |
| `MutationObserver`, `IntersectionObserver`, `ResizeObserver` | DOM | `observe` | `disconnect` |
| `BroadcastChannel`, событие `storage` | другие вкладки | `onmessage` | `close` |

## Проблемы паттерна

- **Утечки** — забытая отписка держит подписчика (и всё его окружение) в памяти. См. [Отписки и утечки памяти](/tracks/rxjs/memory-leaks).
- **Неявный поток управления** — трудно понять, кто реагирует на событие и в каком порядке.
- **Каскады** — подписчик меняет состояние, вызывая новые уведомления; возможны циклы.
- **Синхронные исключения** — ошибка в одном подписчике может прервать уведомление остальных (зависит от реализации).

## Pub/Sub — не совсем Observer

В Observer подписчики знают субъекта. В **Publish/Subscribe** между ними посредник — шина или брокер: издатели и подписчики не знают друг о друге, связаны только именем канала. Это развязывает компоненты сильнее, но усложняет отладку. В масштабе систем это брокеры сообщений (см. [Событийная архитектура](/tracks/architecture/event-driven)), в масштабе приложения — сервис-шина на `Subject` или сторы с actions.

> [!INTERVIEW]
> «Как Observer реализован в Angular?» — Сразу несколькими механизмами: RxJS (`Observable`, `Subject`) для потоков событий, сигналы — реактивные значения с автоматическим отслеживанием подписчиков и pull-моделью пересчёта, `output()` для событий компонента, а также браузерные наблюдатели (`ResizeObserver`, `IntersectionObserver`). Главное правило — управлять временем жизни подписок: `async` pipe, `toSignal`, `takeUntilDestroyed`.

## Коротко

- Observer — уведомление многих подписчиков об изменении субъекта.
- Подписка возвращает способ отписаться; забытая отписка — утечка.
- Push (RxJS, события) и pull (сигналы) — две модели уведомления.
- Pub/Sub добавляет посредника между издателями и подписчиками.
- В Angular: RxJS, сигналы, outputs, браузерные Observer API.
