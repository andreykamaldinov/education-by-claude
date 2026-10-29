CQRS и Event Sourcing — архитектурные паттерны из мира бэкенда, которые часто упоминают вместе. Во фронтенде их идеи живут в Redux/NgRx, и понимание первоисточника помогает осмысленно пользоваться сторами.

## CQS — разделение команд и запросов

Бертран Мейер: метод либо **изменяет** состояние (команда), либо **возвращает** данные (запрос), но не то и другое сразу.

```ts
// Нарушение: «запрос» с побочным эффектом
getNextTicketNumber(): number {
  return ++this.counter;
}

// CQS
peekNextTicketNumber(): number { return this.counter + 1; }
issueTicket(): void { this.counter++; }
```

Сигналы Angular естественно поддерживают CQS: чтение — `count()`, изменение — `count.set()`/`update()`; `computed` — чистый запрос.

## CQRS — Command Query Responsibility Segregation

Расширение идеи на уровень архитектуры: **модели записи и чтения разделяются**.

```text
               Команды (изменить)                  Запросы (прочитать)
Клиент ──▶ Command handlers ──▶ модель записи     Клиент ──▶ Query handlers ──▶ модели чтения
                    │             (нормализована,                                (денормализованы,
                    │              с инвариантами)                                под конкретные экраны)
                    └──── события ──── проекции ────────────────────────────────▶
```

Зачем:

- Записи нужны правила, транзакции, нормализация.
- Чтению нужны быстрые выборки в форме экрана: «заказ с именем клиента, суммой и статусом доставки».
- Нагрузка на чтение обычно в разы выше — модели можно масштабировать раздельно.

Цена: две модели, синхронизация между ними, **eventual consistency** — модель чтения обновляется с задержкой.

## Event Sourcing

Обычно храним **текущее состояние** (баланс = 500). Event Sourcing хранит **последовательность событий**, а состояние вычисляется их сворачиванием:

```ts
type AccountEvent =
  | { type: 'Opened'; owner: string }
  | { type: 'Deposited'; amount: number }
  | { type: 'Withdrawn'; amount: number };

const events: AccountEvent[] = [
  { type: 'Opened', owner: 'Анна' },
  { type: 'Deposited', amount: 1000 },
  { type: 'Withdrawn', amount: 300 },
];

type Account = { owner: string; balance: number };

const apply = (state: Account, event: AccountEvent): Account => {
  switch (event.type) {
    case 'Opened':
      return { owner: event.owner, balance: 0 };
    case 'Deposited':
      return { ...state, balance: state.balance + event.amount };
    case 'Withdrawn':
      return { ...state, balance: state.balance - event.amount };
  }
};

const current = events.reduce(apply, { owner: '', balance: 0 }); // { owner: 'Анна', balance: 700 }
```

Плюсы: полный аудит («как мы пришли к этому состоянию»), восстановление состояния на любой момент, новые проекции из старых событий, естественная интеграция через события. Минусы: сложность, версионирование событий, снапшоты для производительности, eventual consistency.

## Связь с Redux и NgRx

| Event Sourcing / CQRS | NgRx |
| --- | --- |
| события | actions (`[Cart] Product Added`) |
| функция `apply(state, event)` | reducer |
| текущее состояние = свёртка событий | store state |
| проекции / модели чтения | selectors (мемоизированные) |
| обработчики событий с побочными эффектами | effects |
| воспроизведение истории | Redux DevTools time travel |

NgRx — «event sourcing в памяти»: состояние никогда не меняется напрямую, только через события, и его можно воспроизвести. Селекторы — это CQRS-проекции: компонент читает данные в нужной ему форме, не зная структуры хранения.

```ts
// «Модель чтения» под конкретный экран
export const selectOrderListVm = createSelector(selectOrders, selectCustomers, (orders, customers) =>
  orders.map((o) => ({ id: o.id, customer: customers[o.customerId]?.name ?? '—', total: o.total })),
);
```

## Что это значит для фронтенда при CQRS на бэкенде

- После команды («создать заказ») данные в списке могут появиться **не сразу**. Нужен оптимистичный UI или повторный запрос, а не «спиннер, пока не появится».
- API может разделяться на командные эндпоинты (возвращают `202 Accepted` и id) и запросные.
- Real-time уведомления (WebSocket/SSE) о событиях помогают обновить модель чтения на клиенте.

> [!INTERVIEW]
> «Что такое CQRS и есть ли он во фронтенде?» — Разделение модели записи (команды с правилами и инвариантами) и модели чтения (запросы, оптимизированные под экраны), часто с синхронизацией через события и eventual consistency. Во фронтенде идеи CQRS и event sourcing лежат в основе NgRx: actions — события, reducers сворачивают их в состояние, а селекторы — проекции для чтения в форме, нужной компоненту.

## Коротко

- CQS: метод либо меняет состояние, либо возвращает данные.
- CQRS: раздельные модели записи и чтения; цена — синхронизация и eventual consistency.
- Event Sourcing: состояние = свёртка событий; полный аудит и воспроизведение.
- NgRx: actions — события, reducer — свёртка, selectors — проекции.
- При CQRS на бэкенде фронтенду нужен оптимистичный UI.
