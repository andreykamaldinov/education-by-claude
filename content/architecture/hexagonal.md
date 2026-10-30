Гексагональная архитектура (Alistair Cockburn, 2005), она же **Ports and Adapters**, изолирует ядро приложения от внешнего мира. Ядро общается с окружением только через **порты** — интерфейсы, которые оно само определяет. Конкретные технологии подключаются **адаптерами**.

## Картинка

```text
             ┌──────── входящие адаптеры (driving) ────────┐
             │  UI-компоненты   CLI   тесты   WebSocket     │
             └───────────────┬────────────────────────────┘
                             ▼ входящие порты (use cases)
                 ┌───────────────────────────┐
                 │                           │
                 │     Ядро приложения       │
                 │  (домен + сценарии)       │
                 │                           │
                 └───────────────────────────┘
                             │ исходящие порты (что нужно ядру)
             ┌───────────────▼────────────────────────────┐
             │  HTTP API   localStorage   Stripe   Sentry  │
             └──────── исходящие адаптеры (driven) ────────┘
```

Шестиугольник — просто метафора: сторон («портов») может быть сколько угодно, и ни одна не главная. UI — такой же адаптер, как база данных.

## Порты

- **Входящие (driving, primary)** — что ядро умеет делать: `PlaceOrder`, `SearchProducts`. Их вызывают UI, тесты, обработчики событий.
- **Исходящие (driven, secondary)** — что ядру нужно от мира: `OrderRepository`, `PaymentGateway`, `Clock`, `Notifier`. Ядро определяет их в своих терминах.

## Адаптеры

- **Входящие** — переводят внешнее событие в вызов порта: компонент Angular вызывает `placeOrder.execute()`, обработчик WebSocket вызывает `applyPriceUpdate()`.
- **Исходящие** — реализуют порт с помощью технологии: `HttpOrderRepository`, `IndexedDbDraftStore`, `StripePaymentGateway`, `InMemoryOrderRepository` (для тестов и демо).

## Пример: черновики документов

```ts
// core/ports.ts — порты, сформулированные ядром
export abstract class DraftStore {
  abstract save(draft: Draft): Promise<void>;
  abstract load(id: string): Promise<Draft | null>;
}
export abstract class Clock {
  abstract now(): Date;
}

// core/autosave.ts — логика ядра не знает, где хранятся черновики
@Injectable({ providedIn: 'root' })
export class Autosave {
  private readonly store = inject(DraftStore);
  private readonly clock = inject(Clock);

  async save(id: string, content: string) {
    if (content.trim().length === 0) return;
    await this.store.save({ id, content, savedAt: this.clock.now() });
  }
}

// adapters/indexed-db.draft-store.ts — исходящий адаптер для браузера
@Injectable()
export class IndexedDbDraftStore extends DraftStore { /* idb */ }

// adapters/memory.draft-store.ts — для SSR и тестов
@Injectable()
export class MemoryDraftStore extends DraftStore {
  readonly #drafts = new Map<string, Draft>();
  async save(draft: Draft) { this.#drafts.set(draft.id, draft); }
  async load(id: string) { return this.#drafts.get(id) ?? null; }
}

// Конфигурация выбирает адаптеры
providers: [
  { provide: DraftStore, useFactory: () => (isPlatformBrowser(inject(PLATFORM_ID)) ? new IndexedDbDraftStore() : new MemoryDraftStore()) },
  { provide: Clock, useValue: { now: () => new Date() } },
];
```

Тест ядра без браузера и без Angular-окружения:

```ts
const store = new MemoryDraftStore();
const autosave = TestBed.configureTestingModule({
  providers: [
    { provide: DraftStore, useValue: store },
    { provide: Clock, useValue: { now: () => new Date('2026-10-29T12:00:00Z') } },
  ],
}).inject(Autosave);
```

## Чем отличается от чистой архитектуры

По сути — та же идея (зависимости внутрь, ядро определяет абстракции), разные акценты:

| | Гексагональная | Чистая |
| --- | --- | --- |
| Фокус | симметрия «внутри/снаружи», порты и адаптеры | концентрические слои и правило зависимостей |
| Слои внутри ядра | не предписаны | entities → use cases |
| Терминология | ports, adapters, driving/driven | entities, use cases, interface adapters |

Onion architecture — ещё один близкий вариант. На собеседовании важнее объяснить общий принцип, чем различия названий.

## Когда это полезно во фронтенде

- Офлайн-приложения: одни и те же сценарии работают с сетью и с локальной базой.
- Несколько платформ: веб, мобильное приложение (Ionic/Capacitor), десктоп с разными адаптерами хранения и уведомлений.
- SSR: серверные адаптеры для браузерных API.
- Интеграции со сторонними SDK, которые могут смениться (платежи, карты, аналитика).
- Тесты сложной логики без моков HTTP.

> [!INTERVIEW]
> «Что такое Ports and Adapters?» — Архитектура, где ядро приложения общается с внешним миром только через порты — интерфейсы, определённые самим ядром. Входящие порты — сценарии, которые вызывают UI и тесты; исходящие — то, что ядру нужно от инфраструктуры (хранилище, платежи, время). Конкретные технологии подключаются адаптерами, которые реализуют порты. В Angular порты — абстрактные классы или `InjectionToken`, адаптеры — провайдеры, выбираемые конфигурацией.

## Коротко

- Ядро определяет порты; технологии подключаются адаптерами.
- Входящие порты — сценарии; исходящие — потребности ядра.
- UI — такой же адаптер, как база данных.
- В Angular: абстрактные классы-токены + провайдеры с выбором реализации.
- Особенно полезно для офлайна, SSR, нескольких платформ и тестов.
