**Facade** предоставляет простой интерфейс к сложной подсистеме. Клиенту не нужно знать, сколько сервисов, сторов и API участвует в операции — он вызывает один понятный метод.

## Задача

Компонент оформления заказа без фасада:

```ts
export class CheckoutPage {
  private readonly cartStore = inject(Store);
  private readonly addressApi = inject(AddressApi);
  private readonly deliveryApi = inject(DeliveryApi);
  private readonly payment = inject(PaymentGateway);
  private readonly analytics = inject(Analytics);
  private readonly router = inject(Router);

  async placeOrder() {
    const items = await firstValueFrom(this.cartStore.select(selectCartItems));
    const address = await firstValueFrom(this.addressApi.getDefault());
    const delivery = await firstValueFrom(this.deliveryApi.quote(address, items));
    const confirmation = await this.payment.pay(calculateTotal(items, delivery));
    this.cartStore.dispatch(CartActions.clear());
    this.analytics.track({ type: 'purchase', value: confirmation.amount });
    await this.router.navigate(['/orders', confirmation.orderId]);
  }
}
```

Компонент знает об устройстве всей подсистемы заказа. Любое изменение процесса — правка UI-кода, а тестировать компонент приходится с шестью моками.

## Фасад

```ts
@Injectable({ providedIn: 'root' })
export class CheckoutFacade {
  private readonly store = inject(Store);
  private readonly addressApi = inject(AddressApi);
  private readonly deliveryApi = inject(DeliveryApi);
  private readonly payment = inject(PaymentGateway);
  private readonly analytics = inject(Analytics);

  // Состояние для UI
  readonly items = this.store.selectSignal(selectCartItems);
  readonly total = this.store.selectSignal(selectCartTotal);
  readonly placing = signal(false);

  // Одна операция вместо оркестрации в компоненте
  async placeOrder(): Promise<OrderId> {
    this.placing.set(true);
    try {
      const items = this.items();
      const address = await firstValueFrom(this.addressApi.getDefault());
      const delivery = await firstValueFrom(this.deliveryApi.quote(address, items));
      const confirmation = await this.payment.pay(calculateTotal(items, delivery));
      this.store.dispatch(CartActions.clear());
      this.analytics.track({ type: 'purchase', value: confirmation.amount });
      return confirmation.orderId;
    } finally {
      this.placing.set(false);
    }
  }
}

export class CheckoutPage {
  protected readonly checkout = inject(CheckoutFacade);
  private readonly router = inject(Router);

  protected async placeOrder() {
    const orderId = await this.checkout.placeOrder();
    await this.router.navigate(['/orders', orderId]);
  }
}
```

## Фасад над стором

Самое популярное применение во фронтенде — фасад, скрывающий NgRx (или другой стор):

```ts
@Injectable({ providedIn: 'root' })
export class ProductsFacade {
  private readonly store = inject(Store);

  readonly products = this.store.selectSignal(productsFeature.selectVisible);
  readonly loading = this.store.selectSignal(productsFeature.selectLoading);

  load() { this.store.dispatch(ProductsActions.load()); }
  setFilter(filter: Filter) { this.store.dispatch(ProductsActions.setFilter({ filter })); }
}
```

Плюсы:

- компоненты не знают про actions, selectors и effects;
- можно мигрировать с NgRx Store на SignalStore или сервис на сигналах, не меняя компоненты;
- проще тестировать: в тесте компонента подменяется один фасад.

Минусы:

- ещё один слой;
- риск «божественного фасада», который знает обо всём приложении.

> [!TIP]
> Делайте фасад на фичу (корзина, каталог, профиль), а не один на всё приложение. Фасад — точка входа фичи, а не свалка методов.

## Фасады вокруг нас

- `HttpClient` — фасад над `HttpBackend`, интерсепторами, сериализацией, XSRF.
- `Router` — фасад над разбором URL, деревом маршрутов, guards, историей браузера.
- `inject(FormBuilder)` — фасад над созданием `FormControl`/`FormGroup`.
- Публичный API библиотеки (`index.ts`) — фасад над её внутренним устройством.

## Facade и Smart/Presentational

Фасады естественно сочетаются с разделением компонентов: «умный» компонент страницы общается с фасадом, «глупые» презентационные компоненты получают данные через inputs и сообщают о событиях через outputs. См. [Smart и presentational компоненты](/tracks/architecture/smart-dumb).

> [!INTERVIEW]
> «Зачем фасад над NgRx?» — Чтобы компоненты зависели от простого API фичи (сигналы состояния и методы), а не от деталей стора — actions, selectors, effects. Это упрощает компоненты и их тесты, позволяет поменять реализацию стора без переписывания UI и задаёт явную границу фичи. Цена — дополнительный слой, поэтому фасад делают на фичу, а не на всё приложение.

## Коротко

- Facade — простой вход в сложную подсистему.
- Компонент вызывает одну операцию, оркестрация — в фасаде.
- Фасад над стором отвязывает UI от технологии хранения состояния.
- Один фасад на фичу, не на всё приложение.
- `HttpClient`, `Router` и публичный API библиотек — тоже фасады.
