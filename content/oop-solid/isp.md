**Interface Segregation Principle**: клиенты не должны зависеть от методов, которые они не используют. Лучше несколько маленьких специализированных контрактов, чем один «толстый».

## Нарушение

```ts
type Repository<T> = {
  getAll(): Observable<T[]>;
  getById(id: string): Observable<T>;
  create(item: T): Observable<T>;
  update(item: T): Observable<T>;
  delete(id: string): Observable<void>;
  export(format: 'csv' | 'xlsx'): Observable<Blob>;
  subscribeToChanges(): Observable<Change<T>>;
};
```

Проблемы:

- Справочник стран доступен только для чтения, но обязан «реализовать» `create`, `delete`, `export` — заглушками с `throw` (нарушение [LSP](/tracks/oop-solid/lsp)).
- Компонент выпадающего списка, которому нужен только `getAll`, зависит от всего контракта: в тесте приходится мокать семь методов.
- Изменение сигнатуры `export` затрагивает всех, кто зависит от `Repository`, даже если экспорт им не нужен.

## Разделение

```ts
type Readable<T> = {
  getAll(): Observable<T[]>;
  getById(id: string): Observable<T>;
};

type Writable<T> = {
  create(item: Omit<T, 'id'>): Observable<T>;
  update(item: T): Observable<T>;
  delete(id: string): Observable<void>;
};

type Exportable = { export(format: 'csv' | 'xlsx'): Observable<Blob> };

type Repository<T> = Readable<T> & Writable<T>; // композиция, где нужно всё

// Справочник реализует только чтение
class CountriesApi implements Readable<Country> { /* ... */ }

// Компонент зависит от минимума
@Component({ selector: 'app-country-select', template: `...` })
export class CountrySelect {
  readonly source = input.required<Readable<Country>>();
}
```

Тест компонента теперь требует фейк из двух методов.

## ISP в Angular

### Узкие токены DI

```ts
// Вместо внедрения «толстого» AuthService везде
export abstract class CurrentUser {
  abstract readonly user: Signal<User | null>;
}

export abstract class PermissionChecker {
  abstract can(permission: Permission): boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements CurrentUser, PermissionChecker {
  /* login, logout, refresh, user, can… */
}

providers: [
  { provide: CurrentUser, useExisting: AuthService },
  { provide: PermissionChecker, useExisting: AuthService },
];

// Компонент шапки зависит только от того, что ему нужно
export class Header {
  protected readonly currentUser = inject(CurrentUser);
}
```

`useExisting` отдаёт тот же экземпляр под разными узкими «ролями».

### Узкие inputs

```ts
// Плохо: компонент принимает целого пользователя, а использует два поля
readonly user = input.required<User>();

// Лучше: явные зависимости, проще переиспользовать и тестировать
readonly name = input.required<string>();
readonly avatarUrl = input<string>();
```

Компонент аватарки, который требует весь `User` с адресом и настройками, нельзя использовать для автора комментария, у которого есть только имя и фото.

### Хуки жизненного цикла

Сам Angular следует ISP: каждый хук — отдельный интерфейс (`OnInit`, `OnDestroy`, `AfterViewInit`). Компонент реализует только нужные, а не один `Lifecycle` с восемью методами.

## Признаки нарушения

- Реализации с методами-заглушками или `throw new Error('not implemented')`.
- Моки в тестах, где половина методов — `() => {}` «чтобы компилировалось».
- Изменение одного метода интерфейса требует правок в несвязанных местах.

> [!INTERVIEW]
> «Приведите пример Interface Segregation» — Вместо одного интерфейса репозитория с чтением, записью и экспортом выделяются `Readable`, `Writable`, `Exportable`, и каждый клиент зависит только от нужного: справочник реализует только чтение, выпадающий список требует только `Readable`. В Angular — узкие абстрактные токены над большим сервисом через `useExisting`, узкие inputs компонентов и отдельные интерфейсы хуков жизненного цикла.

## Коротко

- Клиент зависит только от того, что использует.
- Маленькие контракты комбинируются через `&`.
- Заглушки и «пустые» методы в реализациях — сигнал к разделению.
- В Angular: узкие токены через `useExisting`, узкие inputs.
- Узкие зависимости — простые тесты.
