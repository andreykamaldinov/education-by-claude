`OnPush` — стратегия, при которой компонент проверяется не всегда, а только когда есть основания считать, что он изменился. С Angular 22 это поведение по умолчанию для всех компонентов. Чтобы писать корректный код, нужно точно знать, что именно «помечает» компонент.

## Когда компонент OnPush проверяется

1. **Изменилась ссылка на input**, переданный из шаблона родителя: `[user]="user"` получил новый объект.
2. **Событие** из шаблона этого компонента или его потомков: `(click)`, `(input)`, host-слушатели, outputs дочерних компонентов.
3. **Изменился сигнал**, прочитанный в шаблоне компонента.
4. **Явный вызов** `ChangeDetectorRef.markForCheck()` — так работает `async` pipe при новом значении потока.

Всё остальное — `setTimeout`, ответ HTTP с `subscribe`, мутация объекта, изменение поля из сервиса — компонент **не обновит**.

## Ловушка 1: мутация входных данных

```ts
@Component({
  selector: 'app-user-list',
  template: `@for (u of users(); track u.id) { <li>{{ u.name }}</li> }`,
})
export class UserList {
  readonly users = input.required<User[]>();
}

// Родитель
export class Page {
  users: User[] = [];

  add(user: User) {
    this.users.push(user); // ссылка та же → UserList не обновится
    this.users = [...this.users, user]; // новая ссылка → обновится
  }
}
```

Отсюда правило: при `OnPush` данные обновляются **иммутабельно**. См. урок [об иммутабельности](/tracks/javascript/immutability).

## Ловушка 2: обновление поля в асинхронном колбэке

```ts
export class Clock {
  time = new Date();

  constructor() {
    setInterval(() => (this.time = new Date()), 1000); // при OnPush экран застынет
  }
}
```

Исправления — от лучшего к худшему:

```ts
// 1. Сигнал
protected readonly time = signal(new Date());
constructor() {
  setInterval(() => this.time.set(new Date()), 1000);
}

// 2. Observable + async pipe (или toSignal)
protected readonly time$ = interval(1000).pipe(map(() => new Date()));

// 3. Ручная пометка
private readonly cdr = inject(ChangeDetectorRef);
constructor() {
  setInterval(() => {
    this.time = new Date();
    this.cdr.markForCheck();
  }, 1000);
}
```

## Ловушка 3: subscribe с присваиванием

```ts
export class Profile {
  user?: User;

  constructor() {
    inject(UserApi).current().subscribe((u) => (this.user = u)); // OnPush не узнает
  }
}
```

Правильно — `toSignal(api.current())` или `async` pipe. Оба решают и проблему отписки.

## Почему OnPush быстрее

```text
Eager-дерево: событие в любом месте → проверяются все 500 компонентов
OnPush-дерево: событие в Cart → проверяется путь App → Layout → Cart и его потомки
Сигнал в Cart изменился → обновляется только Cart
```

При правильных данных разница огромна на больших страницах: таблицы, дашборды, длинные списки.

## OnPush и сигналы — идеальная пара

```ts
@Component({
  selector: 'app-cart-badge',
  template: `<span class="badge">{{ cart.count() }}</span>`,
})
export class CartBadge {
  protected readonly cart = inject(CartStore); // count — computed-сигнал
}
```

Компонент не получает inputs и не имеет событий, но обновится, когда `count` изменится в любом месте приложения: шаблон прочитал сигнал — и подписан на него.

## Когда может понадобиться Eager

- Компонент отображает данные, которые мутируются сторонней библиотекой, и переписать это сейчас нельзя.
- Переходный период миграции большого приложения на Angular 22: можно временно указать `ChangeDetectionStrategy.Eager` проблемным компонентам.

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  /* ... */
})
export class LegacyGrid {}
```

Помните: стратегия наследуется вниз — если родитель `OnPush` не проверяется, его дети-`Eager` тоже не будут проверены (обход до них просто не дойдёт).

## Чек-лист компонента под OnPush

- [ ] Состояние компонента — сигналы, производные — `computed`.
- [ ] Inputs не мутируются; родитель передаёт новые ссылки.
- [ ] Потоки отображаются через `async` pipe или `toSignal`, а не `subscribe` + присваивание.
- [ ] Сторонние колбэки (карты, графики, WebSocket) пишут в сигналы.
- [ ] Нет методов с тяжёлой логикой в шаблоне.

> [!INTERVIEW]
> «Компонент с OnPush не обновляется после ответа сервера. Почему и как исправить?» — Вероятно, результат присваивается обычному полю в `subscribe`. Для `OnPush` это не повод для проверки: не изменилась ссылка input, не было события шаблона, не вызван `markForCheck`, не изменился сигнал. Исправления: `toSignal` или `async` pipe; либо записывать результат в `signal`; в крайнем случае — `markForCheck()` после присваивания.

## Коротко

- OnPush (по умолчанию в Angular 22) проверяет компонент по поводу: новый input, событие, сигнал, `markForCheck`.
- Мутации и присваивания в асинхронных колбэках не обновляют UI.
- Решение — сигналы, `async` pipe, иммутабельные данные.
- Сигналы обновляют конкретный компонент, минуя проверку предков.
- `Eager` — временный выход для легаси-кода.
