Signals — реактивные примитивы Angular. Сигнал хранит значение и знает, кто его читает. Когда значение меняется, Angular точно знает, какие вычисления и какие шаблоны нужно обновить. Это фундамент zoneless-режима, `OnPush` по умолчанию и новых API: `input()`, `model()`, `resource()`, Signal Forms.

## signal: записываемое значение

```ts
const count = signal(0); // WritableSignal<number>

count(); // 0 — чтение вызовом функции
count.set(5); // заменить значение
count.update((n) => n + 1); // вычислить новое из старого

const readonly = count.asReadonly(); // Signal<number> — без set/update
```

Сравнение по умолчанию — `Object.is`. Если новое значение совпадает со старым, подписчики не уведомляются. Можно задать своё:

```ts
const position = signal({ x: 0, y: 0 }, { equal: (a, b) => a.x === b.x && a.y === b.y });
```

> [!WARNING]
> Мутация объекта внутри сигнала не является изменением сигнала:
> ```ts
> const todos = signal<Todo[]>([]);
> todos().push(newTodo); // никто не узнает
> todos.update((list) => [...list, newTodo]); // правильно
> ```

## computed: производное значение

```ts
const items = signal<CartItem[]>([]);
const discount = signal(0.1);

const subtotal = computed(() => items().reduce((sum, item) => sum + item.price * item.qty, 0));
const total = computed(() => subtotal() * (1 - discount()));
```

Свойства `computed`:

- **Ленивость** — функция не выполняется, пока значение никто не прочитал.
- **Мемоизация** — результат кешируется до изменения зависимостей.
- **Динамические зависимости** — отслеживаются только сигналы, прочитанные при последнем выполнении:

```ts
const showDetails = signal(false);
const details = computed(() => (showDetails() ? expensiveDetails() : null));
// пока showDetails === false, изменения expensiveDetails не вызывают пересчёт
```

- `computed` только для чтения и не должен иметь побочных эффектов.

## Как это работает: граф зависимостей

```text
items ──┐
        ├──▶ subtotal ──┐
qty  ───┘               ├──▶ total ──▶ шаблон компонента
discount ───────────────┘
```

Когда функция `computed` или шаблон выполняется, Angular ставит себя «текущим потребителем». Каждый вызов `signal()` регистрирует связь «производитель → потребитель». При записи в сигнал:

1. **Push**: потребители помечаются «грязными» (dirty) — без пересчёта.
2. **Pull**: при следующем чтении `computed` проверяет, изменились ли версии зависимостей, и пересчитывается только при необходимости.

Такая схема избегает лишних вычислений и «глитчей» — промежуточных несогласованных состояний.

## effect: побочные эффекты

```ts
export class SearchPage {
  readonly query = input('');
  private readonly analytics = inject(Analytics);

  constructor() {
    effect(() => {
      // перезапускается при изменении query
      this.analytics.track('search', { query: this.query() });
    });

    effect((onCleanup) => {
      const id = setInterval(() => this.poll(), 5000);
      onCleanup(() => clearInterval(id)); // перед следующим запуском и при уничтожении
    });
  }
}
```

- Эффект выполняется асинхронно, в процессе change detection, после изменения зависимостей; несколько изменений подряд дают один запуск.
- Эффект, созданный в компоненте, уничтожается вместе с компонентом.
- Нужен контекст инъекции (конструктор/поле) или явный `{ injector }`.

### Когда эффект — плохая идея

```ts
// Плохо: синхронизация одного сигнала с другим через effect
effect(() => this.fullName.set(`${this.first()} ${this.last()}`));

// Хорошо: производное значение — это computed
readonly fullName = computed(() => `${this.first()} ${this.last()}`);
```

Эффекты предназначены для синхронизации с **внешним миром**: DOM вне Angular, `localStorage`, логирование, сторонние библиотеки (графики, карты), аналитика. Если эффект пишет в другой сигнал — почти всегда нужен `computed` или `linkedSignal`.

## untracked

Прочитать сигнал без создания зависимости:

```ts
effect(() => {
  const user = this.currentUser(); // зависимость
  untracked(() => this.logger.log('пользователь', user, this.debugLevel())); // debugLevel не отслеживается
});
```

## linkedSignal: записываемое значение, зависящее от другого

Классическая задача: выбранный элемент списка, который сбрасывается при смене списка, но может меняться пользователем.

```ts
export class ShippingPicker {
  readonly options = input.required<ShippingOption[]>();

  // по умолчанию — первый вариант; при смене options пересчитывается
  readonly selected = linkedSignal(() => this.options()[0]);

  choose(option: ShippingOption) {
    this.selected.set(option); // пользователь может выбрать вручную
  }
}
```

Расширенная форма позволяет сохранить выбор, если он остался в новом списке:

```ts
readonly selected = linkedSignal<ShippingOption[], ShippingOption | undefined>({
  source: this.options,
  computation: (options, previous) =>
    options.find((o) => o.id === previous?.value?.id) ?? options[0],
});
```

На этой платформе `linkedSignal` сбрасывает код в редакторе, подсказки и результат запуска при переходе к другой задаче.

## Сигналы в компонентах

```ts
@Component({
  selector: 'app-todo-list',
  template: `
    <p>Осталось: {{ remaining() }}</p>
    @for (todo of visible(); track todo.id) {
      <app-todo [todo]="todo" (toggle)="toggle(todo.id)" />
    }
  `,
})
export class TodoList {
  readonly filter = input<'all' | 'active'>('all');
  private readonly todos = signal<readonly Todo[]>([]);

  protected readonly visible = computed(() =>
    this.filter() === 'all' ? this.todos() : this.todos().filter((t) => !t.done),
  );
  protected readonly remaining = computed(() => this.todos().filter((t) => !t.done).length);

  protected toggle(id: string) {
    this.todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
}
```

Шаблон — тоже потребитель: когда меняется сигнал, прочитанный в шаблоне, Angular помечает **именно этот компонент** для проверки и планирует change detection. Поэтому сигналы отлично работают с `OnPush` и без zone.js.

## Сервис-стор на сигналах

```ts
@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly state = signal<{ todos: readonly Todo[]; loading: boolean }>({
    todos: [],
    loading: false,
  });

  readonly todos = computed(() => this.state().todos);
  readonly loading = computed(() => this.state().loading);

  add(title: string) {
    this.state.update((s) => ({ ...s, todos: [...s.todos, { id: crypto.randomUUID(), title, done: false }] }));
  }
}
```

Наружу — только `computed` (чтение), изменения — через методы. Это простой и достаточный для многих приложений паттерн управления состоянием.

## debounced (Angular 22, экспериментально)

```ts
readonly query = signal('');
readonly debouncedQuery = debounced(this.query, 300); // Resource<string>
readonly results = httpResource(() => `/api/search?q=${this.debouncedQuery.value()}`);
```

`debounced` возвращает ресурс, значение которого «догоняет» источник после паузы.

## Сигналы против RxJS

| | Signals | RxJS |
| --- | --- | --- |
| Модель | значение во времени (всегда есть текущее) | поток событий |
| Синхронность | чтение синхронно | любая |
| Подписка/отписка | автоматически | вручную или операторами |
| Время, отмена, гонки | нет встроенных средств | `debounceTime`, `switchMap`, `retry` |
| Лучше всего для | состояние UI, производные данные | асинхронные процессы, события, WebSocket |

Они дополняют друг друга; мосты — `toSignal` и `toObservable` (см. [RxJS в Angular](/tracks/angular/rxjs-interop)).

> [!INTERVIEW]
> «Чем `computed` отличается от `effect`?» — `computed` вычисляет производное значение: ленивый, мемоизированный, без побочных эффектов, его можно читать. `effect` выполняет побочное действие при изменении зависимостей и ничего не возвращает. Если хочется записать в сигнал внутри `effect` — почти всегда нужен `computed` или `linkedSignal`.

## Коротко

- `signal` — значение с отслеживанием чтений; обновление через `set`/`update` с новой ссылкой.
- `computed` — ленивое мемоизированное производное значение с динамическими зависимостями.
- `effect` — только для синхронизации с внешним миром.
- `linkedSignal` — записываемое состояние, сбрасываемое при смене источника.
- Шаблон — потребитель сигналов: изменение помечает конкретный компонент для проверки.
