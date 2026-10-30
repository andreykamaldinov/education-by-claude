Angular создаёт компонент, проверяет его биндинги, рендерит дочерние компоненты и в конце уничтожает. На каждом этапе можно выполнить свой код через хуки жизненного цикла. С приходом сигналов многие хуки стали нужны реже, но знать их порядок — обязательно.

## Порядок хуков

```text
constructor
  ↓
ngOnChanges        — при первой установке inputs и каждой их смене (только для @Input)
  ↓
ngOnInit           — один раз, после первого ngOnChanges
  ↓
ngDoCheck          — на каждой проверке компонента
  ↓
ngAfterContentInit — один раз, после проекции контента
ngAfterContentChecked — после каждой проверки проецированного контента
  ↓
ngAfterViewInit    — один раз, после создания своего view и дочерних
ngAfterViewChecked — после каждой проверки view
  ↓
… повторные проверки: ngOnChanges? → ngDoCheck → ngAfterContentChecked → ngAfterViewChecked
  ↓
ngOnDestroy        — перед уничтожением
```

Плюс хуки рендеринга уровня приложения: `afterNextRender` и `afterEveryRender` (они выполняются после того, как Angular обновил DOM всего приложения).

## constructor и ngOnInit

```ts
export class UserProfile implements OnInit {
  private readonly api = inject(UserApi); // DI — в поле или конструкторе
  readonly userId = input.required<string>();

  constructor() {
    // inputs ещё НЕ установлены: this.userId() бросит ошибку для required input
  }

  ngOnInit() {
    // inputs установлены — можно начинать загрузку
    this.api.load(this.userId());
  }
}
```

- **constructor** — для внедрения зависимостей и создания сигналов, `computed`, `effect`. Это «контекст инъекции», `inject()` работает здесь и в инициализаторах полей.
- **ngOnInit** — для логики, зависящей от значений inputs.

> [!TIP]
> С сигнальными inputs загрузку данных часто выражают реактивно: `resource`/`httpResource` с параметрами из `input()` или `effect`. Тогда компонент сам перезагрузит данные при смене input, а `ngOnInit` и `ngOnChanges` не нужны.

## ngOnChanges

Вызывается для inputs, объявленных через `@Input`, когда родитель передал **новую ссылку**:

```ts
ngOnChanges(changes: SimpleChanges) {
  const change = changes['userId'];
  if (change && !change.firstChange) {
    this.reload(change.currentValue);
  }
}
```

Мутация объекта (`user.name = 'x'`) не вызовет `ngOnChanges` — ссылка та же. Для сигнальных `input()` хук тоже вызывается, но вместо него естественнее `computed` или `effect`.

## ngDoCheck

Вызывается на **каждой** проверке компонента — сотни раз. Используется для собственного обнаружения изменений (например, `KeyValueDiffers` для мутируемых объектов). Если вы пишете `ngDoCheck`, скорее всего, стоит перейти на иммутабельные данные или сигналы.

## AfterContent и AfterView

```ts
export class Tabs implements AfterContentInit, AfterViewInit {
  @ContentChildren(Tab) tabs!: QueryList<Tab>;
  @ViewChild('header') header!: ElementRef<HTMLElement>;

  ngAfterContentInit() {
    this.tabs.first?.activate(); // проецированные табы уже доступны
  }

  ngAfterViewInit() {
    this.header.nativeElement.focus(); // DOM своего шаблона уже создан
  }
}
```

> [!WARNING]
> Изменение состояния, которое уже отобразилось, в `ngAfterViewInit` приводит к ошибке `ExpressionChangedAfterItHasBeenCheckedError` в режиме разработки: значение изменилось после того, как Angular его проверил. Подробнее — в уроке [Change Detection](/tracks/angular/change-detection).

## ngOnDestroy и DestroyRef

```ts
export class LiveChart implements OnDestroy {
  private readonly socket = new WebSocket('wss://example.com/prices');

  ngOnDestroy() {
    this.socket.close();
  }
}
```

Современная альтернатива — `DestroyRef`. Его можно внедрить где угодно (компонент, директива, сервис, функция-хелпер), и регистрировать очистку рядом с кодом, который её требует:

```ts
export function useInterval(callback: () => void, ms: number) {
  const id = setInterval(callback, ms);
  inject(DestroyRef).onDestroy(() => clearInterval(id));
}

export class Clock {
  protected readonly now = signal(new Date());

  constructor() {
    useInterval(() => this.now.set(new Date()), 1000);
    interval(5000).pipe(takeUntilDestroyed()).subscribe(() => this.sync()); // RxJS-вариант
  }
}
```

## afterNextRender и afterEveryRender

Хуки для работы с DOM **после** того, как Angular закончил рендеринг. Они не выполняются при серверном рендеринге (SSR), что делает их безопасным местом для браузерных API.

```ts
export class CodeEditor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private editor?: EditorView;

  constructor() {
    afterNextRender(() => {
      // один раз, когда элемент уже в DOM
      this.editor = new EditorView({ parent: this.host.nativeElement });
    });

    afterEveryRender({
      read: () => this.host.nativeElement.getBoundingClientRect().height,
      // фазы earlyRead / write / mixedRead / read минимизируют layout thrashing
    });
  }
}
```

Похожий по смыслу `afterRenderEffect` — эффект, который перезапускается при изменении прочитанных сигналов, но выполняется после рендера. Так на этой платформе к заголовкам урока добавляются якоря и кнопки «Копировать».

## Хуки директив и сервисов

- Директивы имеют те же хуки, что и компоненты (кроме связанных с собственным view).
- Сервисы имеют только `ngOnDestroy` — вызывается при уничтожении инжектора (например, сервис в `providers` компонента уничтожается вместе с компонентом). Сервис `providedIn: 'root'` живёт, пока живёт приложение.

> [!INTERVIEW]
> «Чем отличается constructor от ngOnInit?» — Конструктор вызывает JavaScript при создании класса; в нём Angular предоставляет контекст инъекции, но inputs ещё не установлены. `ngOnInit` вызывает Angular после первой установки inputs. Поэтому DI и создание сигналов — в конструкторе или полях, а логика, зависящая от inputs, — в `ngOnInit` (или реактивно через `computed`/`resource`).

## Коротко

- Порядок: constructor → OnChanges → OnInit → DoCheck → AfterContent → AfterView → OnDestroy.
- Конструктор — для DI; `ngOnInit` — когда нужны значения inputs.
- `ngOnChanges` реагирует на новую ссылку, не на мутацию.
- `DestroyRef` и `takeUntilDestroyed` — очистка рядом с кодом, который её требует.
- `afterNextRender` / `afterEveryRender` — работа с DOM, безопасно для SSR.
