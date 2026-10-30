Пайп преобразует значение прямо в шаблоне: `{{ price | currency: 'RUB' }}`. Главная его ценность — не синтаксис, а кеширование: чистый пайп пересчитывается только при изменении входных данных.

## Встроенные пайпы

```html
{{ today | date: 'd MMMM y, HH:mm' }}       <!-- 29 октября 2026, 15:41 (с локалью ru) -->
{{ 1234.5 | number: '1.0-2' }}              <!-- 1 234,5 -->
{{ 0.256 | percent: '1.1-1' }}              <!-- 25,6 % -->
{{ 990 | currency: 'RUB' : 'symbol-narrow' }} <!-- 990,00 ₽ -->
{{ title | uppercase }} {{ title | titlecase }}
{{ items | slice: 0 : 3 }}
{{ config | json }}                          <!-- для отладки -->
{{ settings | keyvalue }}                    <!-- объект → массив {key, value} -->
{{ user$ | async }}                          <!-- подписка на Observable/Promise -->
{{ count | i18nPlural: { '=0': 'нет', '=1': 'один', other: '#' } }}
```

Пайпы импортируются в компонент как обычные standalone-классы: `imports: [DatePipe, CurrencyPipe, AsyncPipe]`. Для русских форматов дат и чисел зарегистрируйте локаль (`registerLocaleData(localeRu)` и `LOCALE_ID`).

## Цепочки и параметры

```html
{{ user.birthday | date: 'longDate' | uppercase }}
{{ amount | currency: currencyCode() : 'symbol' : '1.0-0' }}
```

## Свой пайп

```ts
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  private static readonly UNITS = ['Б', 'КБ', 'МБ', 'ГБ'] as const;

  transform(bytes: number | null | undefined, digits = 1): string {
    if (bytes == null || bytes < 0) return '—';
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < FileSizePipe.UNITS.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toFixed(unit === 0 ? 0 : digits)} ${FileSizePipe.UNITS[unit]}`;
  }
}
```

```html
{{ file.size | fileSize }}       <!-- 2.4 МБ -->
{{ file.size | fileSize: 2 }}    <!-- 2.37 МБ -->
```

Пайп может внедрять зависимости через `inject()` — например, сервис локализации.

## Pure и impure

**Чистый пайп** (по умолчанию, `pure: true`) вызывается только когда меняется **ссылка** на вход или параметры. Angular кеширует результат для каждого места использования.

```ts
@Pipe({ name: 'activeOnly' })
export class ActiveOnlyPipe implements PipeTransform {
  transform(users: readonly User[]): User[] {
    return users.filter((user) => user.active);
  }
}
```

```ts
this.users.push(newUser); // ссылка та же — пайп НЕ пересчитается, новый пользователь не появится
this.users = [...this.users, newUser]; // новая ссылка — пересчёт
```

**Нечистый пайп** (`pure: false`) вызывается на **каждой** проверке компонента. Так устроены `async` (следит за новыми значениями потока) и `json`, `keyvalue` (следят за мутациями). Нечистый пайп с дорогим вычислением — гарантированная проблема производительности.

> [!WARNING]
> Не делайте пайп нечистым, чтобы «починить» мутацию массива. Чините данные: используйте иммутабельные обновления — это нужно и для `OnPush`, и для сигналов.

## Пайп против метода против computed

```html
<!-- Метод: вызывается на каждой проверке компонента -->
{{ formatPrice(product.price) }}

<!-- Чистый пайп: только при смене product.price -->
{{ product.price | price }}

<!-- computed: только при смене сигналов-зависимостей -->
{{ formattedPrice() }}
```

| Подход | Пересчёт | Где удобен |
| --- | --- | --- |
| Метод в шаблоне | каждая проверка | тривиальные выражения |
| Чистый пайп | смена входа | форматирование, переиспользуемое во многих шаблонах |
| `computed` | смена зависимостей | логика конкретного компонента |

С сигналами и `OnPush` (по умолчанию в Angular 22) компоненты проверяются гораздо реже, поэтому стоимость методов в шаблоне падает. Но правило остаётся: для форматирования — пайп, для производных данных компонента — `computed`.

## async pipe

```html
@if (user$ | async; as user) {
  <h1>{{ user.name }}</h1>
}
```

`async` подписывается на Observable или Promise, возвращает последнее значение, вызывает `markForCheck()` при новом значении (поэтому работает с `OnPush` и zoneless) и **отписывается при уничтожении** компонента. Подробно — в уроке [RxJS в Angular](/tracks/angular/rxjs-interop).

> [!INTERVIEW]
> «Чем чистый пайп отличается от нечистого?» — Чистый пересчитывается только при изменении ссылки входного значения или параметров, результат кешируется. Нечистый вызывается при каждой проверке компонента и может отслеживать мутации, но дорог. `async` — пример нечистого пайпа: он должен выдавать новые значения потока, даже если ссылка на Observable не менялась.

## Коротко

- Пайп — преобразование значения в шаблоне; встроенные: `date`, `currency`, `number`, `async`, `keyvalue`.
- Свой пайп — класс с `@Pipe` и методом `transform`.
- Чистый пайп пересчитывается при смене ссылки; мутации он не видит.
- Нечистый вызывается на каждой проверке — используйте осторожно.
- Для логики компонента — `computed`, для переиспользуемого форматирования — пайп.
