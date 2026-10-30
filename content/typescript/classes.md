Классы в TypeScript — это обычные классы JavaScript (ES2015+), к которым добавлены модификаторы доступа, `abstract`, `readonly`, `override` и типы. Важно с первого урока различать две вещи: **что проверяет только компилятор** (и исчезает после сборки) и **что реально работает в рантайме**. На этом различии построены почти все вопросы про классы на собеседовании.

| Возможность | Кто обеспечивает | Остаётся в JS после сборки |
| --- | --- | --- |
| `public` / `private` / `protected` | Только компилятор TS | Нет, модификатор стирается |
| `#field` (ECMAScript private) | Движок JavaScript | Да, настоящая приватность |
| `readonly` | Только компилятор | Нет |
| `static` | JavaScript | Да |
| `abstract` | Только компилятор | Класс остаётся обычным классом |
| `override` | Только компилятор | Нет |
| `get` / `set` | JavaScript | Да |

## Анатомия класса

```ts
class User {
  // поле с инициализатором — тип выводится как string
  role = 'guest';
  // поле без инициализатора обязано получить значение в конструкторе (strictPropertyInitialization)
  name: string;
  // readonly: присвоить можно только здесь или в конструкторе
  readonly createdAt = new Date();

  constructor(name: string) {
    this.name = name;
  }

  greet(): string {
    return `Привет, ${this.name}`;
  }
}
```

Если поле заполняется не в конструкторе (например, в `ngOnInit`), TypeScript ругается. Есть оператор `!` — «definite assignment»: `name!: string`. Это обещание компилятору, а не проверка. В Angular лучше обойтись без него: инициализировать поле сразу или использовать `input.required()`.

## Модификаторы доступа

### public

Доступ отовсюду. Это значение по умолчанию, поэтому писать `public` явно обычно не нужно — только для читаемости в публичном API библиотеки.

### private

Доступ только внутри **этого класса**. Наследники и внешний код не видят член.

```ts
class Wallet {
  private balance = 0;

  deposit(amount: number): void {
    this.balance += amount;
  }

  // private действует на уровне КЛАССА, а не экземпляра:
  // один Wallet может читать private-поле другого Wallet
  hasMoreThan(other: Wallet): boolean {
    return this.balance > other.balance; // ✅ можно
  }
}

const wallet = new Wallet();
wallet.balance; // ❌ Property 'balance' is private and only accessible within class 'Wallet'
wallet['balance']; // ⚠️ компилятор это РАЗРЕШАЕТ — «лазейка» через скобки
```

После компиляции `private` исчезает: в рантайме `balance` — обычное свойство. Его видно в `Object.keys`, `JSON.stringify` и в консоли.

> [!WARNING]
> `private` в TypeScript — это «soft private»: защита от случайной ошибки в коде, но не от сознательного доступа. Через `obj['field']`, `as any` или из JavaScript поле доступно.

### protected

Доступ внутри класса **и его наследников**. Снаружи — нет.

```ts
abstract class Repository<T> {
  protected readonly items = new Map<string, T>();

  protected log(message: string): void {
    console.debug(`[${this.constructor.name}] ${message}`);
  }
}

class UserRepository extends Repository<User> {
  add(id: string, user: User): void {
    this.items.set(id, user); // ✅ наследник видит protected
    this.log(`added ${id}`); // ✅
  }
}

new UserRepository().items; // ❌ Property 'items' is protected
```

Две тонкости, которые любят спрашивать:

```ts
class Base {
  protected secret = 1;
}

class Derived extends Base {
  // 1. Наследник может «открыть» protected-член, переобъявив его как public
  public override secret = 1;
}

class Other extends Base {
  compare(other: Base) {
    // 2. Через ссылку на БАЗОВЫЙ класс доступа к protected нет
    return other.secret; // ❌ доступно только через экземпляр Other или его наследников
  }
}
```

### Сводная таблица доступа

| Откуда обращаемся | `public` | `protected` | `private` | `#private` |
| --- | --- | --- | --- | --- |
| Внутри самого класса | ✅ | ✅ | ✅ | ✅ |
| Из класса-наследника | ✅ | ✅ | ❌ | ❌ |
| Снаружи (экземпляр) | ✅ | ❌ | ❌ | ❌ |
| В рантайме через `obj['x']` | ✅ | ✅ (TS ругается) | ✅ (TS разрешает) | ❌ недоступно |

## `#private` — настоящие приватные поля

Это стандарт ECMAScript (ES2022), а не фича TypeScript. Приватность обеспечивает движок.

```ts
class Counter {
  #count = 0;
  static #instances = 0;

  constructor() {
    Counter.#instances++;
  }

  increment(): number {
    return ++this.#count;
  }

  #validate(): void {} // приватные методы тоже бывают

  // brand check: «это точно экземпляр Counter?» без instanceof
  static isCounter(value: object): value is Counter {
    return #count in value;
  }
}

const counter = new Counter();
Object.keys(counter); // []
JSON.stringify(counter); // '{}'
counter['#count']; // undefined — это просто другое (строковое) имя
```

| | `private` (TS) | `#private` (JS) |
| --- | --- | --- |
| Защита в рантайме | Нет | Да |
| Видно в `Object.keys` / `JSON.stringify` | Да | Нет |
| Доступ через `obj['x']` | Да | Нет |
| Конфликт имён с полем наследника | Ошибка компиляции | Нет конфликта, у каждого класса своё поле |
| Работа с `Proxy` | Работает | Обращение через прокси бросает `TypeError` |
| Сборка под старые таргеты | Без накладных расходов | Компилируется в `WeakMap` (ниже ES2022) |

> [!TIP]
> Простое правило: `#private` — когда нужна реальная инкапсуляция (библиотеки, данные, которые нельзя случайно сериализовать). `private` — для обычного кода приложения, где нужна защита от ошибок и важна совместимость с Proxy и моками в тестах.

## readonly

Запрещает переприсваивание после конструктора. Защищает только **ссылку**, а не содержимое.

```ts
class Cart {
  readonly items: string[] = [];
  readonly frozen: readonly string[] = []; // массив тоже только для чтения
}

const cart = new Cart();
cart.items = []; // ❌ Cannot assign to 'items' because it is a read-only property
cart.items.push('книга'); // ✅ мутация содержимого разрешена
cart.frozen.push('книга'); // ❌ Property 'push' does not exist on type 'readonly string[]'
```

`readonly` стирается при компиляции. Если нужна защита в рантайме — `Object.freeze`.

## Параметры конструктора (parameter properties)

Сокращённая запись: модификатор перед параметром объявляет поле и присваивает его.

```ts
// Длинная запись
class ApiClient {
  private readonly baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
}

// То же самое коротко
class ApiClient {
  constructor(private readonly baseUrl: string) {}
}
```

Раньше так писали DI в Angular: `constructor(private readonly http: HttpClient) {}`. Сейчас рекомендуется `inject()`:

```ts
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
}
```

> [!NOTE]
> Parameter properties, `enum` и `namespace` генерируют код, поэтому не работают в режиме «type stripping» (Node.js запускает `.ts`, просто вырезая типы). Флаг `erasableSyntaxOnly` (TS 5.8) запрещает такой синтаксис в проекте.

## static — члены класса, а не экземпляра

`static`-поля и методы принадлежат самому конструктору. Они общие для всех экземпляров и не видны через `this` экземпляра.

```ts
class Temperature {
  static readonly ABSOLUTE_ZERO = -273.15;
  private static created = 0;

  // фабричный метод — именованная альтернатива конструктору
  static fromFahrenheit(f: number): Temperature {
    return new Temperature(((f - 32) * 5) / 9);
  }

  static get count(): number {
    return Temperature.created;
  }

  // static-блок (ES2022) — однократная инициализация класса
  static {
    Temperature.created = 0;
  }

  constructor(readonly celsius: number) {
    if (celsius < Temperature.ABSOLUTE_ZERO) throw new RangeError('Ниже абсолютного нуля');
    Temperature.created++;
  }
}

Temperature.fromFahrenheit(212).celsius; // 100
const t = new Temperature(20);
t.ABSOLUTE_ZERO; // ❌ это член класса, а не экземпляра
```

Особенности `static`:

- **Наследуются.** `class B extends A {}` — `B.staticMethod()` работает, а `this` внутри static-метода указывает на тот конструктор, через который вызвали (`B`).
- **Не могут использовать дженерик класса.** `class Box<T> { static empty: T }` — ошибка: static один на все `T`.
- **Нельзя называть** `name`, `length`, `call` — конфликт со свойствами `Function`.
- `private static` и `static #x` работают как обычно: доступ только внутри класса.

Типичные применения: фабрики (`Date.now()`, `Array.from()`, `Promise.all()`), константы, кэш/реестр экземпляров, singleton.

### Полиморфный this в static-фабрике

```ts
class Model {
  static create<T extends Model>(this: new () => T): T {
    return new this();
  }
}

class Post extends Model {
  title = '';
}

const post = Post.create(); // тип Post, а не Model
```

## private constructor и protected constructor

```ts
// Singleton: создать экземпляр можно только через static-метод
class AppConfig {
  static #instance: AppConfig | undefined;

  private constructor(readonly apiUrl: string) {}

  static get instance(): AppConfig {
    return (AppConfig.#instance ??= new AppConfig('/api'));
  }
}

new AppConfig('/x'); // ❌ Constructor of class 'AppConfig' is private
AppConfig.instance === AppConfig.instance; // true

// protected constructor: нельзя создать напрямую, но можно наследовать
class BaseEntity {
  protected constructor(readonly id: string) {}
}
class Order extends BaseEntity {
  constructor(id: string) {
    super(id); // ✅
  }
}
```

> [!TIP]
> В Angular singleton обычно не нужен: сервис с `providedIn: 'root'` уже один на приложение, а DI позволяет подменить его в тестах. Приватный конструктор полезен в value objects и фабриках вне DI.

## abstract — классы-шаблоны

Абстрактный класс нельзя создать через `new`. Он задаёт общий каркас, а абстрактные члены обязаны реализовать наследники.

```ts
abstract class Shape {
  constructor(readonly name: string) {}

  abstract area(): number; // нет тела — реализует наследник
  abstract readonly sides: number; // абстрактными бывают и поля

  // обычный метод использует абстрактный — это паттерн «шаблонный метод»
  describe(): string {
    return `${this.name}: площадь ${this.area().toFixed(2)}`;
  }
}

class Circle extends Shape {
  readonly sides = 0;
  constructor(private readonly radius: number) {
    super('круг');
  }
  override area(): number {
    return Math.PI * this.radius ** 2;
  }
}

new Shape('?'); // ❌ Cannot create an instance of an abstract class
const shapes: Shape[] = [new Circle(1)];
shapes.map((s) => s.describe()); // ['круг: площадь 3.14']
```

После компиляции `abstract` исчезает: `Shape` — обычный класс, и из JavaScript его можно создать. Если это критично, добавьте проверку `if (new.target === Shape) throw ...`.

### abstract class или interface?

| | `interface` / `type` | `abstract class` |
| --- | --- | --- |
| Есть в рантайме | Нет | Да (можно `instanceof`, можно использовать как DI-токен в Angular) |
| Может содержать реализацию | Нет | Да |
| Модификаторы доступа | Нет | Да |
| Множественное наследование | Класс может `implements` много интерфейсов | Только один `extends` |

Angular-пример: абстрактный класс как токен DI.

```ts
export abstract class Logger {
  abstract log(message: string): void;
}

@Injectable()
export class ConsoleLogger extends Logger {
  override log(message: string): void {
    console.log(message);
  }
}

// providers: [{ provide: Logger, useClass: ConsoleLogger }]
// потребитель: private readonly logger = inject(Logger);
```

## override и noImplicitOverride

`override` говорит: «этот метод переопределяет метод родителя». Если родитель метод переименует или удалит, компилятор сообщит об ошибке, а не создаст молча новый метод.

```ts
class Base {
  render(): string {
    return 'base';
  }
}

class Child extends Base {
  override render(): string {
    return `child + ${super.render()}`;
  }
  override paint() {} // ❌ This member cannot have an 'override' modifier because it is not declared in the base class
}
```

С флагом `noImplicitOverride` в `tsconfig` слово `override` становится обязательным при переопределении. Включайте его вместе со `strict`.

## implements

`implements` только **проверяет**, что класс соответствует интерфейсу. Он не добавляет поля и не выводит типы параметров.

```ts
interface Comparable<T> {
  compareTo(other: T): number;
}

class Version implements Comparable<Version> {
  constructor(readonly major: number) {}
  compareTo(other: Version): number {
    // тип параметра нужно написать самому — из interface он не выводится
    return this.major - other.major;
  }
}
```

Хуки Angular — тот же механизм: `implements OnInit` лишь гарантирует, что метод `ngOnInit` назван правильно.

## Геттеры и сеттеры

```ts
class Temperature {
  #celsius = 0;

  get fahrenheit(): number {
    return this.#celsius * 1.8 + 32;
  }

  set fahrenheit(value: number) {
    this.#celsius = (value - 32) / 1.8;
  }

  // только геттер — свойство доступно только для чтения
  get kelvin(): number {
    return this.#celsius + 273.15;
  }
}
```

- Если есть только `get`, TypeScript считает свойство `readonly`.
- С TS 5.1 типы геттера и сеттера могут не совпадать.
- `accessor` (TS 4.9+, стандартные декораторы) — сокращённая запись пары get/set с приватным хранилищем: `accessor title = '';`.

## Стрелочные поля против методов

```ts
class Button {
  label = 'OK';

  // метод живёт в прототипе, один на все экземпляры; this теряется при передаче как колбэк
  onClick() {
    return this.label;
  }

  // поле-стрелка создаётся для КАЖДОГО экземпляра; this привязан навсегда
  onClickBound = () => this.label;
}

const button = new Button();
const handler = button.onClick;
handler(); // TypeError: Cannot read properties of undefined (в strict mode)
const bound = button.onClickBound;
bound(); // 'OK'
```

Стрелочное поле не переопределить через `super.method()` в наследнике — его нет в прототипе.

## Модификаторы в Angular-компонентах

Принятые в Angular соглашения:

```ts
@Component({
  selector: 'app-user-card',
  template: `<h2>{{ fullName() }}</h2> <button (click)="select()">Выбрать</button>`,
})
export class UserCard {
  // публичный API компонента — inputs/outputs: readonly, без модификатора доступа
  readonly user = input.required<User>();
  readonly selected = output<User>();

  // используется только в шаблоне — protected: шаблон видит, внешний код нет
  protected readonly fullName = computed(() => `${this.user().first} ${this.user().last}`);

  // внутренние зависимости — private
  private readonly analytics = inject(Analytics);

  protected select(): void {
    this.analytics.track('user-selected');
    this.selected.emit(this.user());
  }
}
```

- Шаблон может обращаться к `protected`-членам (с Angular 14), но не к `private`.
- `readonly` для сигналов, inputs, outputs и зависимостей: их не переприсваивают, меняют содержимое через `.set()`.
- `#private` в компонентах встречается редко: шаблон к таким полям обратиться не может.

> [!INTERVIEW]
> **Частые вопросы:**
> - Чем `private` отличается от `#private`? — первое проверяет только компилятор, второе — движок JS в рантайме.
> - Может ли экземпляр класса читать `private`-поле другого экземпляра того же класса? — да, приватность в TS на уровне класса.
> - Что такое `static` и наследуется ли он? — член конструктора, а не экземпляра; да, наследуется, `this` в static-методе — вызывающий конструктор.
> - Можно ли создать экземпляр `abstract`-класса? — в TS нет, в рантайме из JS — да.
> - Когда нужен `protected constructor`? — когда класс предназначен только для наследования.
> - Зачем `override`? — чтобы компилятор ловил переименование или удаление метода в родителе.
> - Почему в Angular-компонентах члены для шаблона делают `protected`? — шаблон их видит, а внешний код и родительские компоненты через `viewChild` — нет.

## Коротко

- `public` / `private` / `protected` / `readonly` / `abstract` / `override` существуют только на этапе компиляции.
- `#private`, `static`, `get` / `set` — часть JavaScript и работают в рантайме.
- `private` — для класса, `protected` — для класса и наследников, снаружи — только `public`.
- `static` — для фабрик, констант и общего состояния; `private constructor` + `static` — singleton.
- `abstract class` — каркас с частичной реализацией и токен DI; `interface` — чистый контракт без рантайма.

Попрактикуйтесь: [Счётчик экземпляров на static](/practice/ts-static-counter), [Счёт с #private](/practice/ts-private-account), [Абстрактные фигуры](/practice/ts-abstract-shapes), [Singleton с приватным конструктором](/practice/ts-singleton-config).
