Объектно-ориентированное программирование организует код вокруг объектов — сущностей, которые объединяют данные и поведение. Четыре классических принципа — инкапсуляция, наследование, полиморфизм и абстракция — встречаются на каждом собеседовании, и Angular с его сервисами и DI построен на них.

## Инкапсуляция

Объект скрывает внутреннее состояние и даёт менять его только через свои методы, которые соблюдают правила (инварианты).

```ts
export class BankAccount {
  #balance = 0; // недоступно снаружи
  readonly #history: Transaction[] = [];

  get balance(): number {
    return this.#balance;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Сумма должна быть положительной');
    this.#balance += amount;
    this.#history.push({ type: 'deposit', amount, at: new Date() });
  }

  withdraw(amount: number): void {
    if (amount > this.#balance) throw new Error('Недостаточно средств');
    this.#balance -= amount;
    this.#history.push({ type: 'withdraw', amount, at: new Date() });
  }
}

const account = new BankAccount();
account.deposit(100);
account.balance = 1_000_000; // ошибка: только геттер
```

Без инкапсуляции любой код мог бы написать `account.balance = -500`, и правило «баланс не уходит в минус» пришлось бы проверять повсюду.

В Angular-сервисе то же самое: приватный `signal`, публичные `computed` и методы.

```ts
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly items = signal<readonly CartItem[]>([]);
  readonly count = computed(() => this.items().length);
  add(item: CartItem) { /* проверки и иммутабельное обновление */ }
}
```

> [!TIP]
> Принцип **Tell, Don't Ask**: вместо «спросить данные и решить за объект» — «сказать объекту, что сделать». Не `if (account.balance >= x) account.balance -= x`, а `account.withdraw(x)`.

## Наследование

Класс-потомок получает поля и методы родителя и может расширять или переопределять их.

```ts
abstract class Shape {
  constructor(readonly name: string) {}
  abstract area(): number;

  describe(): string {
    return `${this.name}: площадь ${this.area().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(private readonly radius: number) {
    super('Круг');
  }
  override area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    super('Прямоугольник');
  }
  override area(): number {
    return this.width * this.height;
  }
}
```

Наследование — самая сильная связь между классами: потомок зависит от деталей родителя. Изменение базового класса может сломать всех наследников («хрупкий базовый класс»). Поэтому современная рекомендация — [композиция вместо наследования](/tracks/oop-solid/composition), а наследование — для настоящих отношений «является» с устойчивым родителем.

## Полиморфизм

Один интерфейс — много реализаций. Код работает с абстракцией и не знает конкретного типа.

```ts
const shapes: Shape[] = [new Circle(1), new Rectangle(2, 3)];
shapes.forEach((shape) => console.log(shape.describe())); // каждый считает площадь по-своему
```

Виды полиморфизма:

- **Подтипов** (через наследование и интерфейсы) — пример выше.
- **Параметрический** — дженерики: `Array<T>`, `signal<T>()` работают с любым типом.
- **Ad-hoc** — перегрузки функций.
- **Структурный** (в TypeScript) — объект подходит, если у него нужная форма, даже без `implements`.

```ts
type Notifier = { send(userId: string, message: string): Promise<void> };

class EmailNotifier implements Notifier {
  async send(userId: string, message: string) { /* SMTP */ }
}
class PushNotifier implements Notifier {
  async send(userId: string, message: string) { /* Web Push */ }
}

async function notifyAll(notifiers: readonly Notifier[], userId: string, message: string) {
  await Promise.all(notifiers.map((n) => n.send(userId, message)));
}
```

В Angular полиморфизм через DI: компонент внедряет абстрактный токен, а конкретная реализация подставляется конфигурацией.

## Абстракция

Выделение существенного и скрытие деталей реализации за простым интерфейсом.

```ts
export abstract class PaymentGateway {
  abstract charge(amount: Money, card: CardToken): Promise<PaymentResult>;
}

@Injectable()
export class StripeGateway extends PaymentGateway {
  async charge(amount: Money, card: CardToken) {
    // десятки строк работы с API, повторы, обработка ошибок
    return { status: 'succeeded' as const, id: 'ch_123' };
  }
}

// app.config.ts
{ provide: PaymentGateway, useClass: StripeGateway }

// компонент знает только абстракцию
export class Checkout {
  private readonly payments = inject(PaymentGateway);
}
```

Абстрактный класс в Angular удобен как DI-токен: в отличие от `interface`, он существует в рантайме.

## Инкапсуляция против абстракции

Их часто путают:

- **Абстракция** — *что* объект делает (интерфейс, контракт). Решает проблему на уровне проектирования.
- **Инкапсуляция** — *как* защищены его внутренности (скрытие состояния). Решает проблему на уровне реализации.

> [!INTERVIEW]
> «Назовите принципы ООП и приведите примеры из Angular» — Инкапсуляция: сервис хранит состояние в приватном сигнале, наружу отдаёт `computed` и методы. Наследование: компоненты могут расширять базовый класс, хотя предпочтительнее композиция через `hostDirectives` и сервисы. Полиморфизм: интерсепторы, валидаторы и `ControlValueAccessor` — разные реализации одного контракта, используемые единообразно. Абстракция: компонент внедряет абстрактный `PaymentGateway`, не зная о конкретном провайдере.

## Коротко

- Инкапсуляция — состояние скрыто, изменение через методы с проверками.
- Наследование — переиспользование через «является»; самая сильная связь.
- Полиморфизм — один интерфейс, разные реализации.
- Абстракция — контракт без деталей; в Angular — абстрактный класс как токен DI.
- Tell, Don't Ask: давайте объекту команды, а не вытаскивайте его данные.
