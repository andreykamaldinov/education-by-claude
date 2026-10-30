Декоратор — функция, которая получает класс или его член и может изменить или дополнить их. В Angular декораторы видны повсюду: `@Component`, `@Injectable`, `@Input`. Важно понимать, что существует **две** реализации декораторов и что Angular давно перестал зависеть от их рантайм-магии.

## Два вида декораторов

| | Экспериментальные (legacy) | Стандартные (TC39, TS 5.0+) |
| --- | --- | --- |
| Флаг | `experimentalDecorators: true` | без флага |
| Сигнатура | `(target, key, descriptor)` | `(value, context)` |
| Параметры конструктора | можно декорировать | нельзя |
| `emitDecoratorMetadata` | поддерживается | нет |
| Где | Angular, NestJS, TypeORM | новые проекты, библиотеки |

Angular-проект по-прежнему включает `experimentalDecorators` в `tsconfig.json`, но компилятор Angular обрабатывает свои декораторы сам (об этом ниже).

## Стандартные декораторы

```ts
function logged<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    console.log(`→ ${name}(${args.join(', ')})`);
    const result = method.call(this, ...args);
    console.log(`← ${name}`, result);
    return result;
  };
}

class Calculator {
  @logged
  add(a: number, b: number) {
    return a + b;
  }
}
```

Декоратор метода возвращает новую функцию, которая заменит исходную. `context` содержит `kind`, `name`, `static`, `private`, `addInitializer` и `metadata`.

### Фабрика декораторов

```ts
function debounce(ms: number) {
  return function <This, Args extends unknown[]>(
    method: (this: This, ...args: Args) => void,
    _context: ClassMethodDecoratorContext,
  ) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return function (this: This, ...args: Args) {
      clearTimeout(timer);
      timer = setTimeout(() => method.apply(this, args), ms);
    };
  };
}

class SearchBox {
  @debounce(300)
  search(query: string) {}
}
```

### Декоратор поля и accessor

```ts
function clamp(min: number, max: number) {
  return function <This>(
    _target: ClassAccessorDecoratorTarget<This, number>,
    _context: ClassAccessorDecoratorContext<This, number>,
  ): ClassAccessorDecoratorResult<This, number> {
    return {
      set(value) {
        _target.set.call(this, Math.min(max, Math.max(min, value)));
      },
      get() {
        return _target.get.call(this);
      },
    };
  };
}

class Volume {
  @clamp(0, 100) accessor level = 50; // auto-accessor
}
```

## Порядок применения

Декораторы одного элемента применяются **снизу вверх** (ближайший к объявлению — первым), а выражения-фабрики вычисляются сверху вниз:

```ts
class Example {
  @first() // фабрика вычисляется 1-й, декоратор применяется 2-м
  @second() // фабрика вычисляется 2-й, декоратор применяется 1-м
  method() {}
}
```

## Как Angular использует декораторы

Декоратор `@Component` — это **метаданные для компилятора**, а не рантайм-код, который что-то делает при загрузке:

```ts
@Component({
  selector: 'app-user-card',
  template: `<h2>{{ name() }}</h2>`,
})
export class UserCard {
  readonly name = input.required<string>();
}
```

При AOT-компиляции (`ngc` / компилятор в Angular CLI) декоратор удаляется, а к классу добавляются статические поля с готовыми инструкциями:

```js
class UserCard {
  static ɵfac = function UserCard_Factory() { return new UserCard(); };
  static ɵcmp = ɵɵdefineComponent({
    type: UserCard,
    selectors: [['app-user-card']],
    inputs: { name: [1, 'name'] },
    template: function UserCard_Template(rf, ctx) {
      if (rf & 1) { ɵɵelementStart(0, 'h2'); ɵɵtext(1); ɵɵelementEnd(); }
      if (rf & 2) { ɵɵadvance(); ɵɵtextInterpolate(ctx.name()); }
    },
  });
}
```

Поэтому Angular не нуждается в `reflect-metadata` и `emitDecoratorMetadata`: типы параметров конструктора компилятор читает из исходников. А функции `inject()`, `input()`, `output()`, `viewChild()` постепенно вытесняют декораторы членов класса (`@Input`, `@Output`, `@ViewChild`, `@Inject`) — они работают одинаково с любыми настройками декораторов и лучше типизированы.

> [!NOTE]
> Пользовательские декораторы на методах Angular-компонентов работают, но с оговорками: декоратор, который оборачивает метод, не знает о change detection, DI и жизненном цикле. Логику вроде debounce в Angular обычно выражают через RxJS, сигналы (`debounced()` в Angular 22) или отдельный сервис.

> [!INTERVIEW]
> «Нужен ли `reflect-metadata` в Angular?» — Нет. Angular с Ivy использует AOT-компиляцию: компилятор сам анализирует декораторы и конструкторы и генерирует статические определения (`ɵcmp`, `ɵfac`, `ɵprov`). Декораторы Angular в рантайме фактически не выполняются, поэтому метаданные отражения не нужны.

## Коротко

- Есть legacy-декораторы (`experimentalDecorators`) и стандартные TC39 (TS 5.0+).
- Стандартный декоратор: `(value, context) => replacement`.
- Фабрики вычисляются сверху вниз, декораторы применяются снизу вверх.
- Декораторы Angular — метаданные для AOT-компилятора, превращаются в статические поля `ɵcmp`, `ɵfac`.
- Новые API (`inject`, `input`, `output`) уменьшают зависимость от декораторов.
