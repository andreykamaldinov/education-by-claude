TypeScript добавляет к классам JavaScript модификаторы доступа, абстрактные члены, `implements`, параметры-свойства и проверку переопределений. Важно понимать, что из этого существует только для компилятора, а что — в рантайме.

## Модификаторы доступа

```ts
class User {
  public name: string; // доступно везде (по умолчанию)
  protected role: Role; // в классе и наследниках (и в шаблоне Angular-компонента)
  private passwordHash: string; // только в этом классе — проверка компилятора
  #sessionToken: string; // только в этом классе — проверка движка JavaScript
  readonly createdAt = new Date(); // нельзя переприсвоить после конструктора

  constructor(name: string, role: Role, hash: string, token: string) {
    this.name = name;
    this.role = role;
    this.passwordHash = hash;
    this.#sessionToken = token;
  }
}
```

| | `private` | `#private` |
| --- | --- | --- |
| Проверяется | компилятором | движком в рантайме |
| Обход | `(user as any).passwordHash`, `user['passwordHash']` | невозможен |
| Видно в `Object.keys`, JSON | да | нет |
| Шаблон Angular | нет | нет |

> [!TIP]
> В Angular-компонентах члены, нужные шаблону, объявляйте `protected` — шаблон компилируется как часть класса и видит их, а внешний код — нет. `private` и `#private` шаблону недоступны.

## Parameter properties

```ts
class OrderService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: AppConfig,
  ) {}
}
```

Модификатор у параметра конструктора одновременно объявляет поле и присваивает его. Удобно, но это синтаксис с рантайм-эффектом (генерирует присваивание), поэтому несовместим с режимом `erasableSyntaxOnly`. В Angular вместо конструкторной инъекции принято использовать `inject()` в полях.

## Абстрактные классы

```ts
abstract class Repository<T extends { id: string }> {
  protected readonly items = new Map<string, T>();

  abstract validate(item: T): void; // наследник обязан реализовать

  save(item: T): void {
    this.validate(item); // шаблонный метод
    this.items.set(item.id, item);
  }
}

class UserRepository extends Repository<User> {
  override validate(user: User) {
    if (!user.email.includes('@')) throw new Error('Некорректный email');
  }
}

new Repository(); // ошибка: нельзя создать экземпляр абстрактного класса
```

Абстрактный класс может содержать реализацию (в отличие от интерфейса) и существует в рантайме (поэтому годится как DI-токен).

## implements

```ts
type Comparable<T> = { compareTo(other: T): number };
type Serializable = { toJSON(): unknown };

class Money implements Comparable<Money>, Serializable {
  constructor(
    readonly amount: number,
    readonly currency: 'RUB' | 'USD',
  ) {}

  compareTo(other: Money) {
    if (other.currency !== this.currency) throw new Error('Разные валюты');
    return this.amount - other.amount;
  }

  toJSON() {
    return { amount: this.amount, currency: this.currency };
  }
}
```

`implements` только **проверяет** форму класса, ничего не добавляя. Реализовать можно и `type`, и `interface`. Angular использует это для хуков: `implements OnInit, OnDestroy`.

## override и noImplicitOverride

```ts
class Base {
  greet() {
    return 'привет';
  }
}

class Child extends Base {
  override greet() {
    return 'здравствуйте';
  }
  override great() {} // ошибка: в Base нет такого метода — опечатка поймана
}
```

С `noImplicitOverride: true` (включено в Angular-проектах) переопределение без `override` — ошибка. Защищает от ситуации, когда метод базового класса переименовали, а наследник молча перестал его переопределять.

## Статические члены

```ts
class IdGenerator {
  static #counter = 0;
  static next(prefix = 'id') {
    return `${prefix}-${++IdGenerator.#counter}`;
  }
}

IdGenerator.next(); // 'id-1'
```

Статика — это глобальное состояние класса. В Angular вместо статических «утилитных» классов используют функции или сервисы: их проще тестировать и подменять.

## Геттеры и сеттеры

```ts
class Temperature {
  #celsius = 0;

  get fahrenheit() {
    return this.#celsius * 1.8 + 32;
  }

  set celsius(value: number) {
    if (value < -273.15) throw new RangeError('Ниже абсолютного нуля');
    this.#celsius = value;
  }
}
```

> [!WARNING]
> Геттер в шаблоне Angular вычисляется при каждой проверке компонента. Тяжёлую логику в геттерах заменяйте на `computed`.

## Классы против функций и объектов

Не всё должно быть классом. В TypeScript-проектах распространён смешанный стиль:

- **Классы** — для сущностей с поведением и инвариантами, сервисов Angular (DI работает с классами), компонентов.
- **Типы + функции** — для данных (DTO, модели состояния) и чистых преобразований.

```ts
// Данные — тип; поведение над ними — функции
type Todo = { readonly id: string; readonly title: string; readonly done: boolean };
const toggle = (todo: Todo): Todo => ({ ...todo, done: !todo.done });
```

> [!INTERVIEW]
> «Чем abstract class отличается от interface в TypeScript?» — Интерфейс (и `type`) существует только при компиляции, описывает форму и не содержит реализации. Абстрактный класс существует в рантайме, может содержать реализацию, поля и конструктор, наследуется через `extends` (только один), а интерфейсов можно реализовать несколько. В Angular абстрактный класс удобен как токен DI, потому что интерфейс токеном быть не может.

## Коротко

- `private` — проверка компилятора, `#private` — настоящая приватность движка.
- `protected` — для членов, используемых в шаблоне компонента.
- Абстрактный класс — частичная реализация + контракт, существует в рантайме.
- `implements` проверяет форму, `override` + `noImplicitOverride` ловят опечатки.
- Данные — типы и функции, поведение с инвариантами — классы.
