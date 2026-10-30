**Strategy** выделяет семейство взаимозаменяемых алгоритмов в отдельные объекты, позволяя выбирать алгоритм во время выполнения. Код-клиент работает с общим интерфейсом и не знает, какая стратегия внутри.

## Задача

```ts
function sortProducts(products: Product[], mode: string) {
  if (mode === 'price-asc') return products.toSorted((a, b) => a.price - b.price);
  if (mode === 'price-desc') return products.toSorted((a, b) => b.price - a.price);
  if (mode === 'rating') return products.toSorted((a, b) => b.rating - a.rating);
  if (mode === 'popular') return products.toSorted((a, b) => b.orders - a.orders);
  // каждый новый вид сортировки — правка этой функции
  return products;
}
```

## Стратегии как объекты (или функции)

```ts
type SortStrategy = {
  readonly id: string;
  readonly label: string;
  readonly compare: (a: Product, b: Product) => number;
};

export const SORT_STRATEGIES = [
  { id: 'price-asc', label: 'Сначала дешёвые', compare: (a, b) => a.price - b.price },
  { id: 'price-desc', label: 'Сначала дорогие', compare: (a, b) => b.price - a.price },
  { id: 'rating', label: 'По рейтингу', compare: (a, b) => b.rating - a.rating },
  { id: 'popular', label: 'Популярные', compare: (a, b) => b.orders - a.orders },
] as const satisfies readonly SortStrategy[];

export type SortId = (typeof SORT_STRATEGIES)[number]['id'];

@Component({
  selector: 'app-catalog',
  template: `
    <select (change)="sortId.set($any($event.target).value)">
      @for (strategy of strategies; track strategy.id) {
        <option [value]="strategy.id">{{ strategy.label }}</option>
      }
    </select>
    @for (product of sorted(); track product.id) { <app-product-card [product]="product" /> }
  `,
})
export class Catalog {
  readonly products = input.required<Product[]>();
  protected readonly strategies = SORT_STRATEGIES;
  protected readonly sortId = signal<SortId>('popular');

  protected readonly sorted = computed(() => {
    const strategy = this.strategies.find((s) => s.id === this.sortId()) ?? this.strategies[0];
    return this.products().toSorted(strategy.compare);
  });
}
```

Список стратегий — данные: из него же строится выпадающий список. Новая сортировка — новая строка в массиве.

> [!TIP]
> В JavaScript стратегия часто — просто функция. Классы нужны, если у стратегии есть состояние, зависимости или несколько связанных методов.

## Стратегии через DI

```ts
export abstract class PricingStrategy {
  abstract price(base: Money, user: User): Money;
}

@Injectable()
export class RegularPricing extends PricingStrategy {
  price(base: Money) { return base; }
}

@Injectable()
export class B2BPricing extends PricingStrategy {
  private readonly contracts = inject(ContractsApi);
  price(base: Money, user: User) { return applyContractDiscount(base, this.contracts.discountFor(user)); }
}

// выбор стратегии конфигурацией — например, для разных приложений или маршрутов
{ path: 'b2b', providers: [{ provide: PricingStrategy, useClass: B2BPricing }], loadChildren: ... }
```

## Стратегии в Angular

Фреймворк сам построен на стратегиях:

| Стратегия | Что определяет |
| --- | --- |
| `ChangeDetectionStrategy.OnPush` / `Eager` | когда проверять компонент |
| `PreloadingStrategy` | какие ленивые маршруты загружать заранее |
| `RouteReuseStrategy` | переиспользовать ли компонент маршрута |
| `TitleStrategy` | как формировать заголовок страницы |
| `LocationStrategy` (`PathLocationStrategy`, `HashLocationStrategy`) | формат URL |
| `ScrollStrategy` (CDK Overlay) | поведение оверлея при прокрутке |
| Валидаторы форм | правило проверки значения |

На этой платформе `TitleStrategy` добавляет «— DevShelf» к заголовкам, а исполнители кода практики — стратегии, выбираемые по языку задачи.

## Strategy против State

Структурно похожи: объект делегирует работу сменяемому объекту. Разница:

- **Strategy** выбирается **клиентом** извне, стратегии не знают друг о друге.
- **State** меняется **изнутри**: состояния сами решают, в какое состояние перейти. См. [State](/tracks/patterns/state).

> [!INTERVIEW]
> «Приведите пример паттерна Strategy в Angular» — `ChangeDetectionStrategy` (OnPush/Eager), `PreloadingStrategy` для ленивых маршрутов, `RouteReuseStrategy`, `TitleStrategy`, `LocationStrategy`. В прикладном коде — сортировки, расчёт цены, способы доставки: семейство взаимозаменяемых алгоритмов за общим интерфейсом, выбираемое пользователем или конфигурацией DI вместо разрастающегося `switch`.

## Коротко

- Strategy — взаимозаменяемые алгоритмы за общим интерфейсом.
- В JavaScript часто достаточно функций и массива описаний.
- Через DI стратегия выбирается конфигурацией провайдеров.
- Angular полон стратегий: change detection, preloading, reuse, title, location.
- Strategy выбирают снаружи, State переключается изнутри.
