**Liskov Substitution Principle** (Барбара Лисков, 1987): объекты подтипа должны заменять объекты базового типа без изменения корректности программы. Если код работает с `Base`, он обязан так же правильно работать с любым наследником — без проверок `instanceof` и сюрпризов.

## Классический пример: квадрат и прямоугольник

```ts
class Rectangle {
  constructor(
    protected width: number,
    protected height: number,
  ) {}
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  override setWidth(w: number) { this.width = w; this.height = w; }
  override setHeight(h: number) { this.width = h; this.height = h; }
}

function stretch(rect: Rectangle) {
  rect.setWidth(5);
  rect.setHeight(4);
  console.assert(rect.area() === 20); // для Square — 16
}
```

Математически квадрат — это прямоугольник. Но **поведенчески** изменяемый квадрат не может заменить изменяемый прямоугольник: он нарушает ожидание «ширина и высота меняются независимо».

Решения: не наследовать (`Square` и `Rectangle` — независимые реализации `Shape`), или сделать фигуры неизменяемыми — тогда противоречия нет.

## Правила контракта

Подтип должен соблюдать контракт базового типа:

| Правило | Значит |
| --- | --- |
| Предусловия нельзя усиливать | наследник принимает **не меньше** входов, чем родитель |
| Постусловия нельзя ослаблять | наследник гарантирует **не меньше**, чем родитель |
| Инварианты сохраняются | правила, всегда истинные для родителя, истинны и для наследника |
| Нет новых исключений | наследник не бросает ошибок, которых не ожидают клиенты базового типа |

### Нарушение: усиление предусловия

```ts
class FileStorage {
  save(name: string, data: Blob): Promise<void> { /* любой размер */ }
}

class LimitedStorage extends FileStorage {
  override async save(name: string, data: Blob) {
    if (data.size > 1_000_000) throw new Error('Слишком большой файл'); // клиенты базового класса не ждут этого
    return super.save(name, data);
  }
}
```

### Нарушение: «пустая» реализация

```ts
class ReadonlyRepository<T> implements Repository<T> {
  save(item: T): Promise<void> {
    throw new Error('Not supported'); // классический запах LSP
  }
}
```

Если подтип не может выполнить часть контракта — контракт слишком широкий. Это одновременно нарушение [ISP](/tracks/oop-solid/isp): разделите `ReadableRepository` и `WritableRepository`.

## LSP и TypeScript

Компилятор проверяет **сигнатуры**: типы параметров и возвращаемых значений. Но не поведение — LSP о семантике. Тип не скажет, что `Square.setWidth` меняет высоту.

Помогают:

- `readonly` и иммутабельность — меньше скрытых побочных эффектов;
- discriminated unions вместо иерархий там, где варианты известны;
- тесты контракта, которые запускаются для каждой реализации:

```ts
function describeRepositoryContract(name: string, create: () => Repository<User>) {
  describe(`${name}: контракт Repository`, () => {
    it('возвращает сохранённую запись', async () => {
      const repo = create();
      await repo.save(user);
      expect(await repo.get(user.id)).toEqual(user);
    });
  });
}

describeRepositoryContract('InMemory', () => new InMemoryRepository());
describeRepositoryContract('Http', () => new HttpRepository(fakeBackend));
```

## LSP в Angular

- **Подмена провайдеров**: `{ provide: Logger, useClass: RemoteLogger }` работает только если `RemoteLogger` ведёт себя как `Logger` — например, не бросает исключение, когда сервер логов недоступен.
- **ControlValueAccessor**: свой контрол формы обязан корректно реализовать контракт — вызывать `onChange`, `onTouched`, уважать `setDisabledState`. Иначе формы «не видят» его состояние.
- **Моки в тестах**: фейк, который ведёт себя иначе, чем настоящий сервис, делает тесты ложно зелёными — тоже нарушение подстановки.

> [!INTERVIEW]
> «Что такое принцип подстановки Лисков?» — Наследник должен быть взаимозаменяем с базовым типом без нарушения корректности: не усиливать предусловия, не ослаблять постусловия, сохранять инварианты и не бросать неожиданных исключений. Классический пример нарушения — изменяемый `Square extends Rectangle`. Признаки нарушения — проверки `instanceof` у клиентов и методы-заглушки с `throw new Error('Not supported')`.

## Коротко

- Подтип заменяет базовый тип без сюрпризов в поведении.
- Не усиливать предусловия, не ослаблять постусловия, сохранять инварианты.
- `throw 'not supported'` и `instanceof` у клиентов — признаки нарушения.
- TypeScript проверяет сигнатуры, но не поведение — помогают тесты контракта.
- В Angular важно при подмене провайдеров и реализации `ControlValueAccessor`.
