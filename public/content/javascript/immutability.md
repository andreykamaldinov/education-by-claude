Иммутабельность — подход, при котором данные не изменяются после создания: вместо правки создаётся новая версия. В Angular это не философия, а практическая необходимость: стратегия `OnPush`, сигналы, NgRx и `@for` с `track` опираются на сравнение **по ссылке**.

## Значения и ссылки

```js
const a = { tags: ['js'] };
const b = a; // копируется ссылка, а не объект
b.tags.push('ts');
a.tags; // ['js', 'ts']
```

Мутация через одну ссылку видна через все остальные. В большом приложении это означает, что данные могут измениться «где-то», и вы не узнаете, где именно.

## Почему иммутабельность важна для Angular

```ts
const items = signal<Todo[]>([]);

// Плохо: массив тот же — signal не узнает об изменении
items().push(newTodo);

// Хорошо: новый массив — новая ссылка — уведомление
items.update((list) => [...list, newTodo]);
```

- Signal сравнивает старое и новое значение через `Object.is`. Та же ссылка — нет обновления.
- Компонент с `OnPush` (стратегия по умолчанию в Angular 22) проверяется, когда меняется **ссылка** входного свойства.
- Селекторы NgRx мемоизируются по ссылкам — мутация ломает мемоизацию.

## Поверхностное копирование

```js
const user = { name: 'Анна', address: { city: 'Казань' } };

const copy1 = { ...user };
const copy2 = Object.assign({}, user);

copy1.name = 'Ольга'; // не влияет на user
copy1.address.city = 'Москва'; // ВЛИЯЕТ на user: address — общая ссылка
```

Spread копирует только первый уровень. Вложенные объекты остаются общими.

### Иммутабельные обновления вложенных данных

```ts
const updated = {
  ...user,
  address: { ...user.address, city: 'Москва' },
};

// Массивы
const added = [...list, item];
const removed = list.filter((x) => x.id !== id);
const replaced = list.map((x) => (x.id === id ? { ...x, done: true } : x));
```

## Методы массива: изменяющие и нет

| Изменяют исходный массив | Возвращают новый |
| --- | --- |
| `push`, `pop`, `shift`, `unshift` | `concat`, spread `[...a, x]` |
| `splice` | `slice`, `toSpliced` |
| `sort`, `reverse` | `toSorted`, `toReversed` |
| `fill`, `copyWithin` | `with(index, value)` |

```js
const scores = [3, 1, 2];
const sorted = scores.toSorted(); // [1, 2, 3], scores не изменился
const patched = scores.with(0, 10); // [10, 1, 2]
```

> [!WARNING]
> `array.sort()` в шаблоне или в `computed` мутирует исходные данные. Используйте `toSorted()` или копию `[...array].sort()`.

## Глубокое копирование: structuredClone

```js
const original = {
  date: new Date(),
  tags: new Set(['a']),
  nested: { list: [1, 2] },
};
const deep = structuredClone(original);

deep.nested.list.push(3);
original.nested.list; // [1, 2]
deep.date instanceof Date; // true
```

`structuredClone` поддерживает `Date`, `Map`, `Set`, `RegExp`, типизированные массивы, циклические ссылки. Не копирует функции, DOM-узлы, геттеры и прототипы классов (экземпляр класса станет обычным объектом).

Почему не `JSON.parse(JSON.stringify(x))`: он теряет `undefined`, функции, превращает `Date` в строку, `Map`/`Set` — в `{}`, падает на циклических ссылках и на `BigInt`.

## Заморозка

```js
const config = Object.freeze({ api: '/api', retry: { count: 3 } });
config.api = '/v2'; // игнорируется (в strict mode — TypeError)
config.retry.count = 5; // работает! freeze поверхностный
```

Глубокая заморозка — рекурсивный обход. На практике в TypeScript-проектах достаточно типов `readonly` и `Readonly<T>`, которые ловят мутации на этапе компиляции без затрат в рантайме:

```ts
type State = {
  readonly items: readonly Todo[];
  readonly filter: 'all' | 'done';
};

function addTodo(state: State, todo: Todo): State {
  // state.items.push(todo); — ошибка компиляции
  return { ...state, items: [...state.items, todo] };
}
```

## Структурное разделение

Иммутабельное обновление не копирует всё дерево: неизменённые ветки переиспользуются. Это делает обновления дешёвыми и позволяет быстро понять, что изменилось — достаточно сравнить ссылки.

```js
const state1 = { user: userObj, cart: cartObj };
const state2 = { ...state1, cart: { ...cartObj, total: 100 } };

state1.user === state2.user; // true — ветка не менялась
state1.cart === state2.cart; // false — изменилась
```

## Immer: мутабельный синтаксис, иммутабельный результат

Для глубоко вложенных структур удобна библиотека Immer: вы «мутируете» черновик, а получаете новый объект со структурным разделением.

```ts
import { produce } from 'immer';

const next = produce(state, (draft) => {
  draft.users[3].address.city = 'Москва';
});
```

## Коротко

- Объекты передаются по ссылке; мутация видна всем владельцам ссылки.
- Angular (`OnPush`, сигналы, NgRx) обнаруживает изменения по новой ссылке.
- Spread и `Object.assign` копируют один уровень; вложенное обновляйте явно.
- `toSorted`, `toReversed`, `with`, `toSpliced` — неизменяющие аналоги.
- `structuredClone` для глубокой копии, `readonly`-типы для защиты на этапе компиляции.
