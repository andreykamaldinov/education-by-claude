**Iterator** даёт способ последовательно обойти элементы коллекции, не раскрывая её внутреннего устройства. В JavaScript паттерн встроен в язык: протокол итерации, `for...of`, генераторы.

## Протокол итерации — это и есть паттерн

```ts
class Playlist implements Iterable<Track> {
  readonly #tracks: Track[] = [];

  add(track: Track) {
    this.#tracks.push(track);
  }

  // Клиент обходит плейлист, не зная, что внутри массив
  *[Symbol.iterator](): Iterator<Track> {
    yield* this.#tracks;
  }

  // Разные способы обхода — разные итераторы
  *shuffled(): Generator<Track> {
    const order = this.#tracks.map((_, i) => i).sort(() => Math.random() - 0.5);
    for (const index of order) yield this.#tracks[index]!;
  }
}

const playlist = new Playlist();
for (const track of playlist) play(track);
for (const track of playlist.shuffled()) play(track);
const titles = [...playlist].map((t) => t.title);
```

Подробно о механике — урок [Итераторы и генераторы](/tracks/javascript/generators-iterators).

## Обход дерева

Итератор особенно полезен для структур, где обход нетривиален:

```ts
type TreeNode<T> = { value: T; children: readonly TreeNode<T>[] };

function* depthFirst<T>(node: TreeNode<T>): Generator<T> {
  yield node.value;
  for (const child of node.children) yield* depthFirst(child);
}

function* breadthFirst<T>(root: TreeNode<T>): Generator<T> {
  const queue: TreeNode<T>[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    yield node.value;
    queue.push(...node.children);
  }
}

// Найти первый подходящий узел — обход остановится сразу, остальное дерево не обходится
for (const item of depthFirst(menuTree)) {
  if (item.url === currentUrl) {
    highlight(item);
    break;
  }
}
```

## Ленивая пагинация

Итератор скрывает, что данные приходят страницами:

```ts
async function* allOrders(api: OrdersApi): AsyncGenerator<Order> {
  let cursor: string | null = null;
  do {
    const page = await api.list({ cursor, limit: 100 });
    yield* page.items;
    cursor = page.nextCursor;
  } while (cursor);
}

// Клиент работает с «бесконечным» потоком заказов
for await (const order of allOrders(api)) {
  if (order.total > 100_000) report(order);
}
```

## Внутренний и внешний итератор

| | Внешний | Внутренний |
| --- | --- | --- |
| Кто управляет обходом | клиент (`next()`, `for...of`, `break`) | коллекция (`forEach`, `map`) |
| Остановка в середине | легко (`break`, `return`) | нельзя (`forEach`) или через `some`/`find` |
| Пример | генераторы, `for...of` | `Array.prototype.forEach` |

## Iterator и Observable

Итератор — **pull**: потребитель запрашивает следующее значение. Observable — **push**: источник сам отправляет значения. Это две стороны одной идеи «последовательность значений»; RxJS иногда описывают как «Iterator + Observer». Перевести одно в другое: `from(iterable)`.

## В Angular

- `@for` работает с любым **итерируемым** объектом, не только с массивом: `Set`, `Map.values()`, результат генератора.
- `QueryList` (`@ViewChildren`) итерируем.
- `KeyValuePipe` превращает объект в итерируемый список пар для шаблона.

```html
@for (tag of selectedTags(); track tag) { <span>{{ tag }}</span> } <!-- selectedTags — Set<string> -->
```

> [!INTERVIEW]
> «Как сделать свой класс перебираемым через for...of?» — Реализовать метод `[Symbol.iterator]()`, возвращающий итератор с методом `next()` → `{ value, done }`. Проще всего — сделать его генератором (`*[Symbol.iterator]() { yield* this.items; }`). Тогда объект работает с `for...of`, spread, деструктуризацией, `Array.from` и `@for` в шаблонах Angular.

## Коротко

- Iterator — обход без раскрытия внутренней структуры.
- В JavaScript встроен: `Symbol.iterator`, `for...of`, генераторы.
- Удобен для деревьев, ленивых и постраничных данных.
- Внешний итератор позволяет остановиться в середине.
- `@for` в Angular принимает любой итерируемый объект.
