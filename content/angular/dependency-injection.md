Внедрение зависимостей (Dependency Injection, DI) — механизм, при котором класс не создаёт свои зависимости сам, а получает их от контейнера. В Angular DI — фундамент: через него работают сервисы, роутер, HttpClient, формы, конфигурация и тестирование.

## Зачем DI

```ts
// Без DI: класс сам решает, какую реализацию использовать
export class OrderService {
  private readonly api = new HttpOrderApi('https://api.shop.ru'); // жёсткая связь
}

// С DI: класс заявляет, что ему нужно; кто и как создаёт — решает конфигурация
export class OrderService {
  private readonly api = inject(OrderApi);
}
```

Выгоды: подмена реализаций (в тестах, в разных окружениях), единый жизненный цикл, отсутствие глобальных синглтонов, соблюдение принципа инверсии зависимостей ([DIP](/tracks/oop-solid/dip)).

## Сервис и inject()

```ts
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly items = signal<readonly CartItem[]>([]);

  readonly count = computed(() => this.items().length);

  add(item: CartItem) {
    this.items.update((list) => [...list, item]);
  }
}

@Component({ /* ... */ })
export class Header {
  protected readonly cart = inject(CartService);
}
```

`providedIn: 'root'` регистрирует сервис в корневом инжекторе: один экземпляр на приложение, создаётся лениво при первом `inject`, и **удаляется из бандла**, если никто его не использует (tree-shakable provider).

### inject() против конструктора

```ts
export class Legacy {
  constructor(private readonly http: HttpClient) {}
}

export class Modern {
  private readonly http = inject(HttpClient);
}
```

`inject()` предпочтительнее: работает в функциях (guards, interceptors, resolvers), не требует `emitDecoratorMetadata`, корректно работает с наследованием и стандартными декораторами. Его можно вызывать только в **контексте инъекции**: конструктор, инициализаторы полей, фабрики провайдеров, функции, выполняемые через `runInInjectionContext`.

## Иерархия инжекторов

```text
Null injector                  — бросает NullInjectorError
  └── Platform injector        — сервисы платформы (общие для нескольких приложений на странице)
       └── Root environment injector — providedIn: 'root', providers из bootstrapApplication
            └── Route environment injectors — providers у маршрутов (ленивые фичи)
                 └── Element injectors       — providers / viewProviders компонентов и директив
```

Поиск зависимости идёт так:

1. Сначала по **дереву элементных инжекторов** — от текущего компонента вверх по DOM-иерархии компонентов.
2. Если не найдено — по **иерархии инжекторов окружения**: маршрута, корневого, платформенного.
3. Не найдено нигде — `NullInjectorError: No provider for X`.

### Провайдер на уровне компонента

```ts
@Component({
  selector: 'app-order-editor',
  providers: [OrderEditorStore], // новый экземпляр для каждого app-order-editor
  template: `<app-order-lines /><app-order-summary />`,
})
export class OrderEditor {}
```

Дочерние компоненты, внедряющие `OrderEditorStore`, получат экземпляр ближайшего предка. Сервис уничтожится вместе с компонентом (сработает его `ngOnDestroy`). Это стандартный способ сделать **локальное состояние фичи**.

`viewProviders` — то же, но не видно проецированному контенту (`ng-content`).

### Провайдер на уровне маршрута

```ts
export const routes: Routes = [
  {
    path: 'admin',
    providers: [AdminApi, { provide: PAGE_SIZE, useValue: 50 }],
    loadChildren: () => import('./admin/admin.routes'),
  },
];
```

Инжектор создаётся при первой активации маршрута и доступен всем компонентам внутри.

## Виды провайдеров

```ts
providers: [
  Logger, // сокращение для { provide: Logger, useClass: Logger }
  { provide: Logger, useClass: ConsoleLogger }, // подмена реализации
  { provide: API_URL, useValue: 'https://api.shop.ru' }, // готовое значение
  { provide: OldLogger, useExisting: Logger }, // алиас на существующий экземпляр
  {
    provide: Storage,
    useFactory: () => (isPlatformBrowser(inject(PLATFORM_ID)) ? localStorage : new MemoryStorage()),
  },
];
```

| Ключ | Что делает |
| --- | --- |
| `useClass` | создаёт экземпляр указанного класса |
| `useValue` | отдаёт готовое значение |
| `useExisting` | ссылается на другой токен (один и тот же экземпляр) |
| `useFactory` | вызывает функцию; внутри можно `inject()` |

## InjectionToken

Для значений, у которых нет класса (строки, конфигурация, функции, интерфейсы), нужен токен:

```ts
export type AppConfig = { apiUrl: string; features: readonly string[] };

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// Токен с фабрикой по умолчанию — не нужен провайдер
export const WINDOW = new InjectionToken<Window>('WINDOW', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).defaultView!,
});

// регистрация
bootstrapApplication(App, {
  providers: [{ provide: APP_CONFIG, useValue: { apiUrl: '/api', features: [] } }],
});

// использование
const config = inject(APP_CONFIG);
```

TypeScript-тип (`type`/`interface`) не существует в рантайме, поэтому сам по себе не может быть токеном — для этого и нужен `InjectionToken`.

## Multi-провайдеры

Несколько провайдеров одного токена собираются в массив. Так расширяемые точки строятся без изменения потребителя:

```ts
export const VALIDATORS = new InjectionToken<readonly Validator[]>('VALIDATORS');

providers: [
  { provide: VALIDATORS, useClass: RequiredValidator, multi: true },
  { provide: VALIDATORS, useClass: EmailValidator, multi: true },
];

const validators = inject(VALIDATORS); // [RequiredValidator, EmailValidator]
```

На этом механизме построены `HTTP_INTERCEPTORS`, `NG_VALIDATORS`, `APP_INITIALIZER`. На этой платформе так подключаются исполнители кода для практики: добавить поддержку нового языка — значит добавить ещё один multi-провайдер `CODE_RUNNERS`.

## Модификаторы поиска

```ts
inject(Logger, { optional: true }); // null вместо ошибки, если не найден
inject(Logger, { self: true }); // искать только в своём инжекторе
inject(Logger, { skipSelf: true }); // начать с родителя (полезно для вложенных однотипных компонентов)
inject(Logger, { host: true }); // не подниматься выше хост-компонента
```

Пример `skipSelf`: вложенное меню получает родительское меню, а не себя.

```ts
@Component({ selector: 'app-menu', providers: [{ provide: MENU, useExisting: Menu }] })
export class Menu {
  readonly parent = inject(MENU, { skipSelf: true, optional: true });
}
```

## Функции-провайдеры: provideX()

Современные библиотеки предоставляют функции, возвращающие набор провайдеров:

```ts
export function provideAnalytics(config: AnalyticsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ANALYTICS_CONFIG, useValue: config },
    AnalyticsService,
    provideAppInitializer(() => inject(AnalyticsService).init()),
  ]);
}

bootstrapApplication(App, { providers: [provideAnalytics({ id: 'G-123' })] });
```

`EnvironmentProviders` нельзя случайно положить в `providers` компонента — только в инжектор окружения.

## Тестирование

```ts
TestBed.configureTestingModule({
  providers: [{ provide: OrderApi, useValue: { load: () => of([fakeOrder]) } }],
});
const service = TestBed.inject(OrderService);
```

DI делает подмену зависимостей в тестах тривиальной — это одна из главных причин его существования.

> [!INTERVIEW]
> «Как Angular ищет зависимость?» — Сначала по иерархии элементных инжекторов: текущий компонент или директива, затем родительские компоненты вверх по дереву. Если не найдено — по иерархии инжекторов окружения: маршрута, корневого, платформенного. Если и там нет — `NullInjectorError` (или `null` при `optional: true`). Модификаторы `self`, `skipSelf`, `host` ограничивают этот путь.

> [!INTERVIEW]
> «Как сделать, чтобы у каждого экземпляра компонента был свой экземпляр сервиса?» — Указать сервис в `providers` компонента. Тогда элементный инжектор компонента создаст отдельный экземпляр, доступный этому компоненту и его потомкам, и уничтожит его вместе с компонентом.

## Коротко

- `inject()` — современный способ получить зависимость; работает в контексте инъекции.
- `providedIn: 'root'` — синглтон приложения, tree-shakable.
- Иерархия: элементные инжекторы → инжекторы окружения (маршрут, root, platform).
- `useClass`, `useValue`, `useExisting`, `useFactory`; `InjectionToken` для не-классов.
- `multi: true` — расширяемые точки; `optional`, `self`, `skipSelf`, `host` — управление поиском.
