Компонент — основной строительный блок Angular: TypeScript-класс с декоратором `@Component`, шаблон и стили. В этом уроке — синтаксис шаблонов, встроенный control flow и взаимодействие шаблона с классом.

## Анатомия компонента

```ts
@Component({
  selector: 'app-product-card', // как использовать: <app-product-card />
  imports: [CurrencyPipe, RouterLink], // что доступно в шаблоне
  templateUrl: './product-card.html', // или inline: template: `...`
  styleUrl: './product-card.css', // стили изолированы (emulated encapsulation)
  host: { class: 'block', '[class.featured]': 'featured()' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly featured = input(false);
  readonly addToCart = output<Product>();

  protected readonly discounted = computed(() => this.product().price * 0.9);
}
```

> [!TIP]
> Члены класса, используемые только в шаблоне, объявляйте `protected`: шаблон их видит, а внешний код — нет. Публичным должно быть только API компонента — `input`, `output`, `model` и методы, которые вызывают родители.

## Биндинги

```html
<!-- Интерполяция: текст -->
<h2>{{ product().title }}</h2>

<!-- Property binding: свойство DOM или input компонента -->
<img [src]="product().imageUrl" [alt]="product().title" />
<app-rating [value]="product().rating" />

<!-- Attribute binding: атрибут, у которого нет DOM-свойства -->
<td [attr.colspan]="span"></td>
<button [attr.aria-label]="label"></button>

<!-- Классы и стили -->
<div [class.active]="isActive()" [class]="{ card: true, featured: featured() }"></div>
<div [style.width.px]="width()" [style]="{ opacity: visible() ? 1 : 0 }"></div>

<!-- Event binding -->
<button (click)="addToCart.emit(product())">В корзину</button>
<input (keydown.enter)="submit()" />

<!-- Two-way binding: [()] — «банан в коробке» -->
<app-quantity [(value)]="quantity" />
<input [(ngModel)]="query" />
```

Разница между **property** и **attribute**: атрибут — то, что написано в HTML, свойство — поле DOM-объекта. `[value]` у input меняет текущее значение, `[attr.value]` — только начальное. Для ARIA и `colspan` нужен `attr.`, потому что соответствующих свойств нет.

## Встроенный control flow

С Angular 17 вместо структурных директив `*ngIf`, `*ngFor`, `*ngSwitch` используется встроенный синтаксис блоков.

### @if

```html
@if (user(); as user) {
  <p>Здравствуйте, {{ user.name }}</p>
} @else if (loading()) {
  <app-spinner />
} @else {
  <a routerLink="/login">Войти</a>
}
```

`as` сохраняет результат выражения в переменную и **сужает тип**: внутри блока `user` — не `null`.

### @for

```html
@for (item of items(); track item.id; let i = $index, last = $last) {
  <li [class.last]="last">{{ i + 1 }}. {{ item.title }}</li>
} @empty {
  <li>Список пуст</li>
}
```

- `track` **обязателен**. По нему Angular сопоставляет элементы между обновлениями и переиспользует DOM. Используйте стабильный идентификатор. `track $index` допустим только для статичных списков.
- Контекстные переменные: `$index`, `$count`, `$first`, `$last`, `$even`, `$odd`.
- `@empty` — что показать для пустого списка.

> [!WARNING]
> `track item` (по ссылке объекта) при каждом обновлении данных с сервера пересоздаёт весь DOM списка: новые объекты — новые ссылки. Отслеживайте по `id`.

### @switch

```html
@switch (state().status) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error [message]="state().error" /> }
  @case ('success') { <app-table [rows]="state().data" /> }
  @default never;
}
```

`@default never;` просит компилятор проверить, что все варианты union-типа обработаны.

### @let

```html
@let total = cart().items.length;
@let user = user$ | async;

<p>Товаров: {{ total }}</p>
@if (user) { <p>{{ user.name }}</p> }
```

`@let` объявляет локальную переменную шаблона, доступную ниже в том же view. Удобно для `async` pipe и длинных выражений.

## Template reference variables

```html
<input #search type="text" />
<button (click)="find(search.value)">Найти</button>

<app-video-player #player />
<button (click)="player.play()">▶</button>

<form #f="ngForm">...</form> <!-- ссылка на директиву через exportAs -->
```

`#name` даёт ссылку на DOM-элемент, экземпляр компонента или директиву (через `exportAs`).

## Выражения в шаблоне

Шаблонные выражения похожи на JavaScript, но ограничены:

- нет присваиваний (кроме обработчиков событий), `new`, `++`, побитовых операторов;
- доступны члены класса компонента, переменные шаблона, `$event` в обработчиках;
- поддерживаются `?.`, `??`, шаблонные строки, `typeof`, `in`, операторы `**` и `void` (в новых версиях).

Выражения в биндингах вычисляются **при каждой проверке** компонента. Поэтому они должны быть быстрыми и без побочных эффектов.

```html
<!-- Плохо: метод вычисляется на каждой проверке -->
<p>{{ calculateTotal() }}</p>

<!-- Хорошо: computed пересчитывается только при изменении зависимостей -->
<p>{{ total() }}</p>
```

## host: биндинги к самому элементу компонента

```ts
@Component({
  selector: 'app-tab',
  host: {
    role: 'tab',
    '[attr.aria-selected]': 'selected()',
    '[class.is-selected]': 'selected()',
    '(click)': 'select()',
    '(keydown.arrowRight)': 'next()',
  },
  template: `<ng-content />`,
})
export class Tab {}
```

Свойство `host` предпочтительнее декораторов `@HostBinding` и `@HostListener`: всё описано в одном месте и проверяется компилятором (`typeCheckHostBindings`).

## Стили и инкапсуляция

| `ViewEncapsulation` | Поведение |
| --- | --- |
| `Emulated` (по умолчанию) | стили компонента получают уникальные атрибуты (`_ngcontent-xxx`) и не протекают наружу |
| `None` | стили глобальные |
| `ShadowDom` | настоящий Shadow DOM браузера |

Селектор `:host` стилизует элемент компонента, `:host(.active)` — с условием. `::ng-deep` пробивает инкапсуляцию, но устарел и не рекомендуется — используйте CSS-переменные для темизации дочерних компонентов.

## Коротко

- Компонент = класс + шаблон + стили + метаданные; standalone по умолчанию.
- Биндинги: `{{ }}`, `[prop]`, `[attr.x]`, `[class.x]`, `[style.x]`, `(event)`, `[(model)]`.
- Control flow: `@if`, `@for` с обязательным `track`, `@switch`, `@let`.
- Выражения в шаблоне вычисляются на каждой проверке — используйте `computed`.
- `host` в метаданных вместо `@HostBinding`/`@HostListener`.
