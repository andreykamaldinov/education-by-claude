`type` и `interface` в TypeScript во многом взаимозаменяемы, поэтому вопрос «что выбрать» задают постоянно. Разница есть, и она практическая.

## Что умеют оба

```ts
interface UserI {
  id: string;
  name: string;
  greet(): string;
}

type UserT = {
  id: string;
  name: string;
  greet(): string;
};

// Оба можно реализовать в классе
class Person implements UserT {
  constructor(
    public id: string,
    public name: string,
  ) {}
  greet() {
    return `Привет, ${this.name}`;
  }
}
```

Оба описывают форму объекта, поддерживают необязательные и `readonly` поля, дженерики, индексные сигнатуры.

## Что умеет только type

`type` — это псевдоним для **любого** типа, а не только объекта:

```ts
type Id = string | number; // объединение
type Point = [number, number]; // кортеж
type Status = 'idle' | 'loading' | 'error'; // литералы
type Handler = (event: Event) => void; // функция
type Keys = keyof User; // производные типы
type ReadonlyUser = Readonly<User>; // утилитарные типы
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }; // mapped
type ElementOf<T> = T extends readonly (infer E)[] ? E : never; // условные
```

Ни одно из этого нельзя записать через `interface`.

## Что умеет только interface

### Слияние объявлений (declaration merging)

Два интерфейса с одним именем объединяются:

```ts
interface Window {
  analytics: AnalyticsClient;
}
// Теперь window.analytics типизирован
```

Так расширяют глобальные типы и типы сторонних библиотек (module augmentation). С `type` повторное объявление — ошибка.

```ts
declare module '@angular/core' {
  interface ComponentCustomProperties {} // условный пример расширения
}
```

Обратная сторона: интерфейс могут «случайно» расширить в другом файле, и вы этого не заметите.

### extends с проверкой совместимости

```ts
interface Animal {
  name: string;
}
interface Dog extends Animal {
  name: 'Шарик'; // сужение допустимо
  bark(): void;
}

interface Broken extends Animal {
  name: number; // ошибка: несовместимое переопределение
}
```

С `type` аналог — пересечение `&`, но при конфликте оно молча даёт `never`:

```ts
type BrokenT = { name: string } & { name: number };
// name: never — объявить можно, создать значение — нет
```

## Производительность компилятора

Команда TypeScript рекомендовала `interface extends` для больших иерархий объектов: отношения интерфейсов кешируются, а сложные пересечения пересчитываются. На практике это заметно только в очень больших проектах с глубокими иерархиями.

## Что выбрать

Обе позиции распространены, главное — единообразие в проекте:

- **«interface для объектов, type для остального»** — традиционный совет из документации TypeScript и стиль многих Angular-кодовых баз.
- **«везде type»** — выбор этой платформы (и многих современных проектов). Аргументы: один инструмент для всего, нет случайного слияния, проще композиция объединений и mapped-типов.

```ts
// Стиль этого проекта: маленькие типы, собранные через & и |
type WithId = { readonly id: string };
type Timestamps = { readonly createdAt: Date; readonly updatedAt: Date };
type Draft = { title: string; body: string };

type Article = WithId & Timestamps & Draft;
type ArticleState = { status: 'loading' } | { status: 'ready'; article: Article } | { status: 'error'; message: string };
```

> [!INTERVIEW]
> «Чем отличается `type` от `interface`?» — `type` может описывать любые типы: объединения, кортежи, функции, условные и mapped-типы. `interface` описывает только объекты, но поддерживает слияние объявлений и `extends` с проверкой конфликтов. Для расширения библиотек нужен `interface`, для объединений и вычисляемых типов — `type`. В остальном выбор — вопрос соглашений команды.

## Коротко

- Для формы объекта подходят оба.
- Объединения, кортежи, mapped и условные типы — только `type`.
- Слияние объявлений и module augmentation — только `interface`.
- `extends` ловит конфликты полей, `&` при конфликте даёт `never`.
- Выберите одно правило на проект и придерживайтесь его (линтер `consistent-type-definitions`).
