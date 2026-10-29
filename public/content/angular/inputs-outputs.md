Компоненты общаются по простому правилу: **данные идут вниз через inputs, события — вверх через outputs**. В современном Angular для этого есть сигнальные функции `input()`, `output()` и `model()`, которые заменяют декораторы `@Input` и `@Output`.

## input()

```ts
@Component({
  selector: 'app-avatar',
  template: `<img [src]="src()" [alt]="name()" [style.width.px]="size()" />`,
})
export class Avatar {
  readonly name = input.required<string>(); // обязательный
  readonly size = input(40); // необязательный со значением по умолчанию, тип number
  readonly src = input<string | undefined>(); // необязательный без значения
}
```

```html
<app-avatar name="Анна" [size]="64" [src]="user.photo" />
```

- `input()` возвращает `InputSignal<T>` — **только для чтения** сигнал. Значение читается вызовом `size()`.
- Отсутствие обязательного input — ошибка **компиляции** шаблона, а не рантайма.
- Из сигнального input удобно строить `computed`:

```ts
readonly initials = computed(() =>
  this.name()
    .split(' ')
    .map((part) => part[0])
    .join(''),
);
```

### Alias и transform

```ts
readonly disabled = input(false, { transform: booleanAttribute });
readonly width = input(0, { transform: numberAttribute });
readonly label = input('', { alias: 'aria-label' });
```

```html
<app-button disabled />  <!-- атрибут без значения → true благодаря booleanAttribute -->
<app-chart width="300" /> <!-- строка → number -->
```

`transform` — чистая функция без побочных эффектов, вызывается при каждом новом значении.

## output()

```ts
@Component({
  selector: 'app-search-box',
  template: `
    <input #box (keydown.enter)="search.emit(box.value)" />
    <button (click)="cleared.emit()">Очистить</button>
  `,
})
export class SearchBox {
  readonly search = output<string>();
  readonly cleared = output<void>();
}
```

```html
<app-search-box (search)="onSearch($event)" (cleared)="reset()" />
```

`output()` возвращает `OutputEmitterRef<T>`: у него есть `emit()`, а родитель подписывается через `(event)`. В отличие от старого `EventEmitter`, это не Subject RxJS: у него нет `pipe`, `next`, его нельзя случайно использовать как поток.

Из Observable можно сделать output и наоборот:

```ts
import { outputFromObservable, outputToObservable } from '@angular/core/rxjs-interop';

readonly scrolled = outputFromObservable(fromEvent(window, 'scroll').pipe(throttleTime(100)));
```

> [!NOTE]
> Outputs Angular **не всплывают** по DOM. Событие получает только непосредственный родитель, который указал `(search)` в шаблоне. Если нужно передать событие через несколько уровней — пробросьте его на каждом уровне или используйте общий сервис.

## model(): двусторонняя привязка

```ts
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="value.update(v => v - 1)">−</button>
    <span>{{ value() }}</span>
    <button (click)="value.update(v => v + 1)">+</button>
  `,
})
export class Counter {
  readonly value = model(0); // ModelSignal<number> — можно читать и писать
}
```

```html
<!-- Родитель с сигналом -->
<app-counter [(value)]="quantity" />  <!-- quantity = signal(1) -->

<!-- Или раздельно -->
<app-counter [value]="qty" (valueChange)="qty = $event" />
```

`model()` создаёт input `value` и output `valueChange`. Запись `[(value)]="quantity"` с сигналом связывает их напрямую: изменения внутри компонента записываются в сигнал родителя.

## Старый синтаксис: @Input и @Output

```ts
export class LegacyAvatar implements OnChanges {
  @Input({ required: true }) name!: string;
  @Input() size = 40;
  @Output() selected = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['name']) {
      this.initials = this.computeInitials(changes['name'].currentValue);
    }
  }
}
```

| | `@Input` | `input()` |
| --- | --- | --- |
| Тип | обычное поле, нужен `!` для required | `InputSignal<T>`, required без `!` |
| Реакция на изменение | `ngOnChanges` или сеттер | `computed` / `effect` |
| Запись изнутри | возможна (антипаттерн) | невозможна |
| Работа с OnPush/zoneless | помечает компонент при смене ссылки | сигнал сам уведомляет о чтении в шаблоне |

Angular CLI умеет мигрировать автоматически: `ng generate @angular/core:signal-input-migration` и `...:output-migration`.

## Передача данных: варианты и когда что выбирать

| Способ | Когда |
| --- | --- |
| `input()` / `output()` | родитель и прямой ребёнок |
| `model()` | компонент редактирует значение родителя (контролы) |
| Общий сервис с сигналами | соседние компоненты, разные ветки дерева |
| Роутер (`withComponentInputBinding`) | параметры URL прямо в `input()` страницы |
| `inject()` родителя | тесно связанные компоненты одной библиотеки (Tabs/Tab) |
| Стор (NgRx, SignalStore) | состояние уровня приложения или фичи |

> [!WARNING]
> Не мутируйте объект, пришедший через input: `this.user().name = 'x'`. Родитель не узнает об изменении, а компонент с `OnPush` может не перерисоваться. Сообщите об изменении через output, и пусть владелец данных создаст новый объект.

> [!INTERVIEW]
> «Как передать данные из ребёнка в родителя?» — Через `output()` (или `@Output` + `EventEmitter`): ребёнок вызывает `emit`, родитель подписывается `(event)="handler($event)"`. Для двустороннего связывания — `model()`. Для несвязанных компонентов — общий сервис. Альтернатива для родителя — получить ссылку на ребёнка через `viewChild()` и вызвать его метод, но это сильнее связывает компоненты.

## Коротко

- `input()` — сигнал только для чтения; `input.required` проверяется компилятором.
- `transform: booleanAttribute / numberAttribute` — для атрибутов из HTML.
- `output()` — типизированное событие; не всплывает по DOM.
- `model()` — двусторонняя привязка `[(value)]`.
- Данные вниз, события вверх; не мутируйте входные объекты.
