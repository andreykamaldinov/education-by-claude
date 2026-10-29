MVC, MVP и MVVM — семейство архитектурных паттернов для пользовательских интерфейсов. Все они решают одну задачу: отделить данные и бизнес-логику от отображения. Различаются тем, кто и как связывает модель с представлением.

## MVC — Model-View-Controller

```text
         ввод пользователя
View ──────────────────────▶ Controller
 ▲                               │
 │ наблюдает / читает            │ изменяет
 │                               ▼
 └────────────────────────── Model
```

- **Model** — данные и бизнес-правила.
- **View** — отображение модели.
- **Controller** — принимает ввод, решает, что сделать с моделью и какое представление показать.

Классический MVC пришёл из Smalltalk (1979). В веб-фреймворках (Rails, Spring MVC, ASP.NET MVC) контроллер обрабатывает HTTP-запрос и выбирает шаблон.

## MVP — Model-View-Presenter

```text
View ◀──────▶ Presenter ◀──────▶ Model
(пассивный)    (вся логика UI)
```

View становится пассивным: только отображает то, что ему передал презентер, и сообщает о действиях пользователя. Презентер знает о view через интерфейс — его легко тестировать без UI.

## MVVM — Model-View-ViewModel

```text
View ◀═══ data binding ═══▶ ViewModel ──────▶ Model
          (автоматически)    (состояние и команды для view)
```

- **ViewModel** — состояние и команды, подготовленные для конкретного представления. Ничего не знает о view.
- **Связывание данных** (data binding) автоматически синхронизирует view с ViewModel — не нужен код, перекладывающий значения в DOM.

Паттерн появился в WPF (Microsoft), популярен в Knockout, Vue, Angular.

## Как на это ложится Angular

Angular ближе всего к **MVVM**:

| MVVM | Angular |
| --- | --- |
| View | шаблон компонента |
| ViewModel | класс компонента (сигналы, `computed`, методы-обработчики) |
| Data binding | `{{ }}`, `[prop]`, `(event)`, `[(model)]` |
| Model | сервисы, сторы, доменные типы, API |

```ts
@Component({
  selector: 'app-cart-summary',
  template: `
    <p>Товаров: {{ vm().count }}</p>
    <p>Итого: {{ vm().total | currency: 'RUB' }}</p>
    <button (click)="checkout()" [disabled]="!vm().canCheckout">Оформить</button>
  `,
})
export class CartSummary {
  private readonly cart = inject(CartStore); // Model

  // ViewModel: данные, подготовленные именно для этого view
  protected readonly vm = computed(() => ({
    count: this.cart.count(),
    total: this.cart.total(),
    canCheckout: this.cart.count() > 0 && !this.cart.checkingOut(),
  }));

  protected checkout() {
    this.cart.checkout(); // команда
  }
}
```

Паттерн «view model» (`vm`) — объединённое состояние для шаблона — удобен, когда в шаблоне много связанных значений.

## Главная ошибка: «толстый компонент»

Если класс компонента делает HTTP-запросы, хранит глобальное состояние, считает налоги и форматирует PDF, он перестаёт быть ViewModel и становится «всем сразу». Признаки и лечение — в уроках [SRP](/tracks/oop-solid/srp) и [Smart и presentational компоненты](/tracks/architecture/smart-dumb).

## Сравнение

| | MVC | MVP | MVVM |
| --- | --- | --- | --- |
| Связь view и модели | view может читать модель | только через презентер | через binding к ViewModel |
| Логика UI | в контроллере | в презенторе | в ViewModel |
| View знает о | модели (часто) | презентере | ViewModel |
| Тестируемость логики UI | средняя | высокая | высокая |
| Типичные технологии | серверные фреймворки | Android (раньше), WinForms | Angular, Vue, WPF, SwiftUI |

> [!INTERVIEW]
> «На какой паттерн похож Angular — MVC или MVVM?» — На MVVM: шаблон — View, класс компонента — ViewModel с состоянием (сигналами) и командами (методами), а связывание данных через биндинги шаблона синхронизирует их автоматически. Model — сервисы, сторы и доменные типы. Ранние версии (AngularJS) позиционировались как MVC/MVW («Model-View-Whatever»).

## Коротко

- MVC — контроллер обрабатывает ввод и меняет модель; view отображает модель.
- MVP — пассивный view, вся логика UI в презенторе.
- MVVM — ViewModel + автоматическое связывание данных.
- Angular: шаблон — View, класс компонента — ViewModel, сервисы — Model.
- Компонент не должен становиться «моделью всего».
