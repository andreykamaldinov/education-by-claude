**Dependency Inversion Principle**:

1. Модули верхнего уровня не должны зависеть от модулей нижнего уровня. Оба должны зависеть от абстракций.
2. Абстракции не должны зависеть от деталей. Детали должны зависеть от абстракций.

«Верхний уровень» — бизнес-логика и сценарии (оформить заказ). «Нижний уровень» — детали: HTTP, localStorage, конкретный платёжный провайдер, библиотека аналитики.

## Нарушение

```ts
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  async checkout(cart: Cart) {
    const stripe = await loadStripe('pk_live_...'); // прямая зависимость от провайдера
    const payment = await stripe.confirmCardPayment(/* ... */);
    await firstValueFrom(this.http.post('https://api.shop.ru/orders', { cart, payment })); // и от формата API
    localStorage.removeItem('cart'); // и от хранилища
    gtag('event', 'purchase', { value: cart.total }); // и от аналитики
  }
}
```

Сценарий оформления заказа знает обо всех деталях. Смена платёжного провайдера, хранилища или аналитики — правка бизнес-логики. Протестировать без настоящего Stripe — сложно.

## Инверсия

Абстракции принадлежат **верхнему уровню** — сценарий сам говорит, что ему нужно:

```ts
// Контракты, сформулированные языком бизнес-логики
export abstract class PaymentGateway {
  abstract pay(amount: Money): Promise<PaymentConfirmation>;
}
export abstract class OrderRepository {
  abstract create(cart: Cart, payment: PaymentConfirmation): Promise<OrderId>;
}
export abstract class CartStorage {
  abstract clear(): void;
}
export abstract class Analytics {
  abstract track(event: AnalyticsEvent): void;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly payments = inject(PaymentGateway);
  private readonly orders = inject(OrderRepository);
  private readonly cartStorage = inject(CartStorage);
  private readonly analytics = inject(Analytics);

  async checkout(cart: Cart): Promise<OrderId> {
    const confirmation = await this.payments.pay(cart.total);
    const orderId = await this.orders.create(cart, confirmation);
    this.cartStorage.clear();
    this.analytics.track({ type: 'purchase', value: cart.total.amount });
    return orderId;
  }
}
```

Детали реализуют абстракции и подключаются конфигурацией:

```ts
@Injectable()
export class StripePaymentGateway extends PaymentGateway { /* Stripe SDK */ }

@Injectable()
export class HttpOrderRepository extends OrderRepository { /* HttpClient */ }

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PaymentGateway, useClass: StripePaymentGateway },
    { provide: OrderRepository, useClass: HttpOrderRepository },
    { provide: CartStorage, useClass: LocalCartStorage },
    { provide: Analytics, useClass: GoogleAnalytics },
  ],
};
```

```text
До:    CheckoutService ──▶ Stripe, HttpClient, localStorage, gtag

После: CheckoutService ──▶ PaymentGateway ◀── StripePaymentGateway
                       ──▶ OrderRepository ◀── HttpOrderRepository
       (стрелки зависимостей деталей направлены к абстракциям — «инверсия»)
```

## Что это даёт

- **Тесты** — подставить фейки, проверить сценарий без сети и SDK.
- **Замена деталей** — новый платёжный провайдер = новый класс и одна строка конфигурации.
- **Окружения** — разные реализации для dev, e2e, SSR (например, `CartStorage` в памяти на сервере).
- **Параллельная работа** — команда фронтенда пишет сценарий против абстракции, пока API ещё не готово.

```ts
TestBed.configureTestingModule({
  providers: [
    { provide: PaymentGateway, useValue: { pay: async () => ({ id: 'test' }) } },
    { provide: OrderRepository, useValue: { create: async () => 'order-1' } },
    { provide: CartStorage, useValue: { clear: () => {} } },
    { provide: Analytics, useValue: { track: () => {} } },
  ],
});
```

## DIP, DI и IoC — не одно и то же

| Термин | Что это |
| --- | --- |
| **DIP** | принцип проектирования: зависеть от абстракций, владельцем абстракции является верхний уровень |
| **DI** (Dependency Injection) | техника: зависимости передаются объекту извне, а не создаются внутри |
| **IoC** (Inversion of Control) | общий принцип: фреймворк управляет потоком и вызывает ваш код («не звоните нам, мы позвоним вам») |
| **DI-контейнер** | инструмент, автоматизирующий DI (инжекторы Angular) |

DI можно использовать без DIP: `inject(HttpClient)` в компоненте — это DI, но компонент по-прежнему зависит от детали (HTTP). DIP — про **направление** зависимостей и то, кто владеет контрактом.

## Мера

Не нужно оборачивать в абстракцию каждую зависимость. `HttpClient` уже абстракция над `fetch`/XHR и легко подменяется в тестах. Абстракции нужны на **границах, которые реально меняются или мешают тестам**: внешние SDK, платёжные системы, аналитика, хранилища, браузерные API, нестабильные внешние API.

> [!INTERVIEW]
> «Чем Dependency Inversion отличается от Dependency Injection?» — DIP — принцип: высокоуровневая логика и низкоуровневые детали зависят от абстракций, причём абстракция формулируется в терминах верхнего уровня. DI — техника передачи зависимостей снаружи, в Angular её автоматизирует инжектор. DI помогает реализовать DIP: компонент внедряет абстрактный `PaymentGateway`, а конфигурация провайдеров подставляет `StripePaymentGateway`.

## Коротко

- Бизнес-логика зависит от абстракций, детали их реализуют.
- Абстракцию формулирует верхний уровень, в своих терминах.
- В Angular: абстрактный класс или `InjectionToken` + провайдер с реализацией.
- DIP — принцип, DI — техника, IoC — общая идея, инжектор — инструмент.
- Абстрагируйте границы, которые меняются или мешают тестам.
