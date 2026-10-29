Сигналы синхронны, а данные с сервера приходят асинхронно. API ресурсов соединяет два мира: `resource` загружает данные по параметрам-сигналам, отслеживает статус, отменяет устаревшие запросы и отдаёт результат как сигнал. В Angular 22 `resource`, `httpResource` и `rxResource` — стабильные публичные API.

## resource

```ts
export class UserPage {
  readonly userId = input.required<string>();

  readonly user = resource({
    params: () => ({ id: this.userId() }), // сигналы, от которых зависит загрузка
    loader: async ({ params, abortSignal }) => {
      const response = await fetch(`/api/users/${params.id}`, { signal: abortSignal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as User;
    },
  });
}
```

Когда `userId` меняется:

1. Ресурс переходит в статус `loading`.
2. Предыдущий незавершённый запрос **отменяется** через `abortSignal`.
3. Вызывается `loader` с новыми параметрами.
4. Результат попадает в `value()`, статус — `resolved` (или `error`).

Если `params` вернёт `undefined`, загрузка не выполняется (статус `idle`) — удобно для условных запросов.

## Состояние ресурса

```ts
user.value(); // T | undefined — данные (сохраняются во время перезагрузки)
user.status(); // 'idle' | 'loading' | 'reloading' | 'resolved' | 'error' | 'local'
user.isLoading(); // loading или reloading
user.error(); // ошибка, если status === 'error'
user.hasValue(); // type guard: value() не undefined

user.reload(); // перезапустить загрузку с теми же параметрами
user.set(updatedUser); // локально заменить значение (статус 'local')
user.update((u) => ({ ...u, name: 'Анна' }));
```

```html
@switch (user.status()) {
  @case ('loading') { <app-skeleton /> }
  @case ('error') {
    <p>Не удалось загрузить профиль.</p>
    <button (click)="user.reload()">Повторить</button>
  }
  @default {
    @if (user.hasValue()) {
      <h1>{{ user.value().name }}</h1>
    }
  }
}
```

> [!WARNING]
> Обращение к `value()` в статусе `error` бросает исключение. Проверяйте `hasValue()` или статус перед чтением, либо задайте `defaultValue` в опциях ресурса.

## httpResource

Обёртка над `HttpClient`, поэтому работают интерсепторы, XSRF и тестирование через `HttpTestingController`:

```ts
export class ProductList {
  readonly category = input('all');
  readonly page = signal(1);

  readonly products = httpResource<Product[]>(() => ({
    url: '/api/products',
    params: { category: this.category(), page: this.page() },
  }), { defaultValue: [] });

  readonly readme = httpResource.text(() => `/docs/${this.category()}.md`);
}
```

Варианты: `httpResource()` (JSON), `.text()`, `.blob()`, `.arrayBuffer()`. Можно передать `parse` — функцию валидации ответа (например, схемой Zod):

```ts
readonly user = httpResource(() => `/api/users/${this.id()}`, { parse: UserSchema.parse });
```

Именно `httpResource.text` загружает тексты уроков на этой платформе: при переходе на другой урок параметр URL меняется и запрос перезапускается автоматически.

## rxResource

Для загрузчиков, которые возвращают Observable:

```ts
import { rxResource } from '@angular/core/rxjs-interop';

readonly orders = rxResource({
  params: () => ({ userId: this.userId() }),
  stream: ({ params }) => this.ordersApi.list(params.userId).pipe(retry(2)),
});
```

`stream` может выдавать несколько значений — ресурс будет обновляться с каждым (например, поток из WebSocket).

## Ресурсы только для чтения данных

Ресурсы проектировались для **получения** данных. Для мутаций (POST, PUT, DELETE) используйте обычные вызовы `HttpClient` или методы стора, а после успешной операции вызывайте `reload()` или `set()`:

```ts
async rename(name: string) {
  const updated = await firstValueFrom(this.api.rename(this.userId(), name));
  this.user.set(updated); // оптимистично или по ответу сервера
}
```

## Сравнение подходов к загрузке

| Подход | Плюсы | Минусы |
| --- | --- | --- |
| `subscribe` в `ngOnInit` | просто | ручная отписка, гонки, нет статуса |
| `async` pipe + `switchMap` | отмена, декларативно | больше RxJS-кода для статусов |
| `resource` / `httpResource` | статус, отмена, сигналы, реакция на inputs | только чтение данных |
| NgRx / SignalStore | кеш, общий доступ, devtools | больше инфраструктуры |

> [!INTERVIEW]
> «Как в Angular загрузить данные, зависящие от input, и не получить гонку запросов?» — Использовать `httpResource` или `resource` с параметрами из `input()`: при изменении параметров предыдущий запрос отменяется, а статус и ошибка доступны как сигналы. В RxJS-стиле — `toObservable(input)` + `switchMap`, который отписывается от предыдущего запроса.

## Коротко

- `resource({ params, loader })` — загрузка, перезапускаемая при смене сигналов-параметров.
- Статусы: `idle`, `loading`, `reloading`, `resolved`, `error`, `local`; `hasValue()` — безопасное чтение.
- `httpResource` использует `HttpClient` (интерсепторы, тесты), есть `.text()`, `.blob()`.
- `rxResource` — загрузчик на Observable.
- Ресурсы — для чтения; мутации — обычными вызовами с последующим `reload()`/`set()`.
