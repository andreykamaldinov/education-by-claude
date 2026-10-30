**Open/Closed Principle**: программные сущности должны быть открыты для расширения, но закрыты для изменения. Новое поведение добавляется **новым кодом**, а не правкой уже работающего и протестированного.

## Нарушение

```ts
export class PriceCalculator {
  calculate(order: Order): number {
    let total = order.subtotal;
    switch (order.customerType) {
      case 'regular':
        break;
      case 'vip':
        total *= 0.9;
        break;
      case 'employee':
        total *= 0.7;
        break;
      // Новая акция → снова правим этот класс, рискуя сломать остальные ветки
    }
    return total;
  }
}
```

Каждый новый вид скидки — изменение класса, повторное тестирование всех веток, конфликты между задачами.

## Решение: стратегии

```ts
export type DiscountRule = {
  readonly id: string;
  applies(order: Order): boolean;
  apply(total: number, order: Order): number;
};

export const vipDiscount: DiscountRule = {
  id: 'vip',
  applies: (order) => order.customerType === 'vip',
  apply: (total) => total * 0.9,
};

export const blackFriday: DiscountRule = {
  id: 'black-friday',
  applies: (order) => isBlackFriday(order.date),
  apply: (total) => total * 0.75,
};

export class PriceCalculator {
  constructor(private readonly rules: readonly DiscountRule[]) {}

  calculate(order: Order): number {
    return this.rules
      .filter((rule) => rule.applies(order))
      .reduce((total, rule) => rule.apply(total, order), order.subtotal);
  }
}
```

Новая акция = новый объект `DiscountRule`. `PriceCalculator` не меняется.

## OCP через DI в Angular

Multi-провайдеры — встроенный механизм «открытого для расширения» кода:

```ts
export const DISCOUNT_RULES = new InjectionToken<readonly DiscountRule[]>('DISCOUNT_RULES');

@Injectable({ providedIn: 'root' })
export class PriceCalculatorService {
  private readonly rules = inject(DISCOUNT_RULES);
  calculate(order: Order) { /* ... */ }
}

// Каждая фича добавляет свои правила, не трогая калькулятор
providers: [
  { provide: DISCOUNT_RULES, useValue: vipDiscount, multi: true },
  { provide: DISCOUNT_RULES, useValue: blackFriday, multi: true },
];
```

Так же устроены сами точки расширения Angular:

| Точка расширения | Что добавляете, не меняя фреймворк |
| --- | --- |
| `withInterceptors([...])` | обработку каждого HTTP-запроса |
| `NG_VALIDATORS` / функции-валидаторы | правила валидации форм |
| `NG_VALUE_ACCESSOR` | новые контролы форм |
| `TitleStrategy`, `RouteReuseStrategy` | поведение роутера |
| `ErrorHandler` | глобальную обработку ошибок |

На этой платформе так добавляются исполнители кода для практики: новый язык — это новый провайдер `CODE_RUNNERS`, а страница задачи не меняется. И так же добавляются треки — новым файлом в реестре, без правок компонентов.

## OCP в компонентах

Компонент, закрытый для изменения, но открытый для расширения:

```ts
// Плохо: каждый новый вид ячейки — новый @case внутри таблицы
@switch (column.type) {
  @case ('text') { ... }
  @case ('date') { ... }
  @case ('status') { ... }
}

// Лучше: потребитель передаёт шаблон ячейки
@Component({
  selector: 'app-table',
  template: `
    @for (row of rows(); track row.id) {
      <tr>
        @for (column of columns(); track column.key) {
          <td>
            <ng-container
              [ngTemplateOutlet]="cellTemplates()[column.key] ?? defaultCell"
              [ngTemplateOutletContext]="{ $implicit: row[column.key], row }"
            />
          </td>
        }
      </tr>
    }
  `,
})
export class Table {}
```

Проекция контента и шаблоны — основной способ сделать UI-компоненты расширяемыми без их изменения.

## Не превращайте OCP в догму

Абстракция «на всякий случай» усложняет код. Разумный подход:

1. Первый раз — пишите просто, даже со `switch`.
2. Когда появилась вторая-третья вариация и видно, что их будет больше, — выделяйте точку расширения.

Главное — предсказать **ось изменений**: что будет меняться часто (виды скидок, способы оплаты, типы уведомлений) — то и делайте расширяемым.

> [!INTERVIEW]
> «Как вы применяете Open/Closed в Angular?» — Через стратегии и DI: общая логика зависит от абстракции (токена), а конкретные реализации добавляются провайдерами, в том числе multi-провайдерами — как интерсепторы и валидаторы. В UI — через проекцию контента и `ngTemplateOutlet`, чтобы потребитель расширял компонент своими шаблонами без правки его кода.

## Коротко

- Новое поведение — новым кодом, а не правкой работающего.
- `switch` по типу, растущий с каждой задачей, — сигнал к стратегии.
- В Angular: multi-провайдеры, интерсепторы, валидаторы, стратегии роутера.
- В UI: проекция контента и шаблоны.
- Делайте расширяемым то, что действительно меняется часто.
