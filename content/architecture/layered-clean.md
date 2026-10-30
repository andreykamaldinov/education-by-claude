Слоистая и чистая архитектура отвечают на вопрос «как разложить код, чтобы бизнес-логика не зависела от деталей». Детали — это фреймворк, база данных, HTTP, UI-библиотека. Они меняются чаще, чем правила бизнеса, и не должны их тянуть за собой.

## Слоистая архитектура

Классическое деление:

```text
┌─────────────────────────────┐
│ Presentation (UI)           │  компоненты, шаблоны
├─────────────────────────────┤
│ Application (сценарии)      │  оркестрация: «оформить заказ»
├─────────────────────────────┤
│ Domain (модель и правила)   │  сущности, правила, вычисления
├─────────────────────────────┤
│ Infrastructure (детали)     │  HTTP, storage, сторонние SDK
└─────────────────────────────┘
```

Правило: слой зависит только от слоёв **ниже**. UI не обращается к HTTP напрямую — только через сценарии.

Проблема классической схемы: домен оказывается **над** инфраструктурой и зависит от неё (сервис домена импортирует репозиторий с HTTP).

## Чистая архитектура

Роберт Мартин (2012) развернул зависимости: в центре — домен, снаружи — детали.

```text
        ┌───────────────────────────────────────┐
        │ Frameworks & Drivers: Angular, HTTP,   │
        │ браузерные API, UI-библиотеки          │
        │   ┌───────────────────────────────┐    │
        │   │ Interface Adapters:           │    │
        │   │ компоненты, presenters,       │    │
        │   │ API-клиенты, мапперы DTO      │    │
        │   │   ┌───────────────────────┐   │    │
        │   │   │ Use Cases             │   │    │
        │   │   │   ┌───────────────┐   │   │    │
        │   │   │   │ Entities      │   │   │    │
        │   │   │   └───────────────┘   │   │    │
        │   │   └───────────────────────┘   │    │
        │   └───────────────────────────────┘    │
        └───────────────────────────────────────┘
        Зависимости направлены только внутрь →
```

**Правило зависимостей**: код во внутреннем круге ничего не знает о внешних. Сущности не знают о use cases, use cases — об Angular и HTTP. Внутренний слой объявляет нужные ему абстракции (порты), внешний их реализует ([DIP](/tracks/oop-solid/dip)).

## Как это выглядит во фронтенде

```text
src/app/orders/
  domain/
    order.ts                # типы и чистые правила: canCancel(order), calculateTotal(items)
  application/
    place-order.use-case.ts # сценарий: проверить, оплатить, создать, очистить корзину
    ports.ts                # абстракции: PaymentGateway, OrderRepository
  infrastructure/
    http-order.repository.ts
    stripe.payment-gateway.ts
    order.mapper.ts         # DTO ↔ домен
  ui/
    checkout-page.ts
    order-summary.ts
```

```ts
// domain/order.ts — чистый TypeScript, тестируется без Angular
export type OrderStatus = 'draft' | 'paid' | 'shipped' | 'cancelled';
export type Order = { readonly id: string; readonly status: OrderStatus; readonly items: readonly OrderItem[] };

export const canCancel = (order: Order): boolean => order.status === 'draft' || order.status === 'paid';
export const total = (order: Order): number => order.items.reduce((s, i) => s + i.price * i.qty, 0);

// application/ports.ts — абстракции, нужные сценарию
export abstract class OrderRepository {
  abstract create(items: readonly OrderItem[]): Promise<Order>;
}
export abstract class PaymentGateway {
  abstract pay(amount: number): Promise<{ paymentId: string }>;
}

// application/place-order.use-case.ts
@Injectable({ providedIn: 'root' })
export class PlaceOrder {
  private readonly orders = inject(OrderRepository);
  private readonly payments = inject(PaymentGateway);

  async execute(items: readonly OrderItem[]): Promise<Order> {
    if (items.length === 0) throw new EmptyCartError();
    const order = await this.orders.create(items);
    await this.payments.pay(total(order));
    return order;
  }
}

// infrastructure — реализации портов; подключаются в providers
{ provide: OrderRepository, useClass: HttpOrderRepository }
```

> [!NOTE]
> Здесь `@Injectable` и `inject()` в use case — компромисс: формально это зависимость от Angular во внутреннем слое. Многие команды принимают его ради удобства DI. Строгий вариант — use case как обычный класс с конструктором, а провайдер создаёт его через `useFactory`.

## Сколько архитектуры нужно фронтенду

Полная чистая архитектура во фронтенде часто избыточна: многие экраны — это «получить данные — показать — отправить форму», и бизнес-правила живут на сервере. Разумная мера:

- **Всегда**: отделять UI от доступа к данным (data-access сервисы, мапперы DTO), выносить вычисления и правила в чистые функции.
- **Когда логика сложная** (калькуляторы, конструкторы, офлайн, сложные формы с правилами): выделять домен и use cases, порты для внешних систем.
- **Не нужно**: оборачивать каждый вызов в use case и плодить слои ради слоёв.

## Признаки, что зависимости нарушены

- Доменный тип импортирует `HttpClient`, `Observable` из компонентов или DTO API.
- Компонент парсит ответ сервера и считает бизнес-правила.
- Смена UI-библиотеки требует правки бизнес-логики.
- Логику нельзя протестировать без `TestBed`.

> [!INTERVIEW]
> «Что такое чистая архитектура и как применить её в Angular?» — Код делится на концентрические слои: сущности и бизнес-правила в центре, use cases вокруг, адаптеры (компоненты, API-клиенты, мапперы) и фреймворки снаружи. Зависимости направлены только внутрь: внутренние слои объявляют абстракции (порты), внешние их реализуют, а DI связывает их. В Angular: доменные типы и правила — чистый TypeScript, сценарии — сервисы, зависящие от абстрактных портов, HTTP и SDK — реализации портов в providers, компоненты — только UI.

## Коротко

- Слои: UI → сценарии → домен → инфраструктура; зависимости только вниз.
- Чистая архитектура переворачивает зависимость домена от инфраструктуры: детали зависят от абстракций домена.
- Во фронтенде: домен и правила — чистый TypeScript, порты — абстрактные классы, реализации — провайдеры.
- Меру определяет сложность логики: не каждое CRUD-приложение требует use cases.
- Тестируемость без Angular — хороший индикатор правильных зависимостей.
