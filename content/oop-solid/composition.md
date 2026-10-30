«Предпочитайте композицию наследованию» — один из самых известных советов из книги «Паттерны проектирования» (Gang of Four). Наследование связывает классы жёстко и навсегда, композиция собирает поведение из независимых частей. В Angular этот принцип реализован буквально: сервисы, `hostDirectives`, функции `inject()`.

## Проблема глубокой иерархии

```ts
class BaseComponent {
  loading = false;
  error: string | null = null;
  handleError(e: unknown) { /* ... */ }
}

class BaseListComponent<T> extends BaseComponent {
  items: T[] = [];
  page = 1;
  load() { /* ... */ }
}

class BaseSelectableListComponent<T> extends BaseListComponent<T> {
  selected = new Set<T>();
}

class UsersComponent extends BaseSelectableListComponent<User> {
  // а если нужна выборка, но без пагинации? Или пагинация без загрузки?
}
```

Проблемы:

- **Взрыв комбинаций**: нужны «список с выбором без пагинации», «с сортировкой, но без выбора» — новые базовые классы.
- **Хрупкий базовый класс**: изменение `BaseComponent` затрагивает всех потомков.
- **Неявные зависимости**: потомок полагается на порядок вызовов и поля родителя.
- **Одиночное наследование**: нельзя взять поведение из двух мест.
- В Angular — проблемы с DI: конструктор базового класса с зависимостями заставляет потомков передавать их через `super(...)`.

## Композиция: собрать из частей

```ts
@Injectable()
export class Pagination {
  readonly page = signal(1);
  readonly pageSize = signal(20);
  next() { this.page.update((p) => p + 1); }
}

@Injectable()
export class Selection<T> {
  private readonly selected = signal<ReadonlySet<T>>(new Set());
  readonly count = computed(() => this.selected().size);
  toggle(item: T) { /* ... */ }
}

@Component({
  selector: 'app-users',
  providers: [Pagination, Selection], // берём только нужное
  template: `...`,
})
export class UsersComponent {
  protected readonly pagination = inject(Pagination);
  protected readonly selection = inject<Selection<User>>(Selection);
  protected readonly users = httpResource<User[]>(() => ({
    url: '/api/users',
    params: { page: this.pagination.page() },
  }));
}
```

Каждая часть тестируется отдельно, комбинируется как угодно, а компонент явно показывает, из чего состоит.

## Композиция поведения элемента: hostDirectives

```ts
@Component({
  selector: 'app-menu-item',
  hostDirectives: [
    { directive: Focusable, inputs: ['disabled'] },
    { directive: Ripple },
    { directive: Tooltip, inputs: ['appTooltip: hint'] },
  ],
  template: `<ng-content />`,
})
export class MenuItem {}
```

Вместо `class MenuItem extends TooltipButton extends FocusableButton` — плоский список поведений. Подробнее — в уроке [Директивы](/tracks/angular/directives).

## Композиция логики: функции

```ts
// Переиспользуемая «фича», которая сама подключает очистку
export function injectWindowSize() {
  const size = signal({ width: window.innerWidth, height: window.innerHeight });
  const onResize = () => size.set({ width: window.innerWidth, height: window.innerHeight });
  window.addEventListener('resize', onResize, { passive: true });
  inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', onResize));
  return size.asReadonly();
}

export class Layout {
  protected readonly windowSize = injectWindowSize();
  protected readonly isMobile = computed(() => this.windowSize().width < 768);
}
```

Функции с `inject()` — аналог хуков React: переиспользование логики без иерархий. NgRx SignalStore построен на той же идее: стор собирается из фич `withState`, `withComputed`, `withMethods`.

## Делегирование

Композиция часто реализуется делегированием: объект передаёт работу вложенному объекту.

```ts
class LoggingRepository<T> implements Repository<T> {
  constructor(
    private readonly inner: Repository<T>,
    private readonly logger: Logger,
  ) {}

  async save(item: T) {
    this.logger.info('save', item);
    return this.inner.save(item); // делегирование
  }
}
```

Это уже паттерн [Decorator](/tracks/patterns/decorator).

## Миксины

TypeScript поддерживает миксины — функции, возвращающие класс:

```ts
type Constructor<T = object> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
  };
}

class Article {}
const TimestampedArticle = Timestamped(Article);
```

Это всё ещё наследование под капотом (цепочка прототипов), со сложными типами. В Angular миксины для компонентов встречаются в старом коде Angular Material, но сегодня их заменили `hostDirectives` и сервисы.

## Когда наследование уместно

- Настоящее отношение «является» с устойчивым родителем: `HttpErrorResponse extends HttpResponseBase`.
- Абстрактный класс как контракт + небольшая общая реализация ([Template Method](/tracks/patterns/template-method)).
- Расширение классов фреймворка, рассчитанных на это (`TitleStrategy`, `RouteReuseStrategy`, `ErrorHandler`).

> [!INTERVIEW]
> «Почему говорят, что композиция лучше наследования?» — Наследование создаёт жёсткую связь: потомок зависит от деталей родителя, изменения базового класса ломают наследников, а сочетания поведений приводят к взрыву иерархии. Композиция собирает объект из независимых частей, которые легко тестировать, заменять и комбинировать. В Angular это сервисы в `providers`, `hostDirectives`, функции с `inject()` и фичи SignalStore вместо базовых компонентов.

## Коротко

- Наследование — «является», жёсткая связь, хрупкие базовые классы.
- Композиция — «содержит»/«использует», гибкая сборка из частей.
- В Angular: сервисы в `providers`, `hostDirectives`, функции с `inject()`.
- Делегирование — основа паттерна Decorator.
- Наследование оставьте для устойчивых абстракций и точек расширения фреймворка.
