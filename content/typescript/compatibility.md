TypeScript использует **структурную типизацию**: совместимость определяется формой значения, а не именем типа. Это удобно, но порождает сюрпризы: лишние поля, вариантность функций, перепутанные идентификаторы. Разберём механику и инструменты для точного контроля — `satisfies`, `as const` и branded types.

## Структурная типизация

```ts
type Point = { x: number; y: number };
type Vector = { x: number; y: number };

const p: Point = { x: 1, y: 2 };
const v: Vector = p; // ок: формы совпадают, имена не важны

class Cat {
  name = 'Мурка';
}
const fake: Cat = { name: 'не кошка' }; // тоже ок — класс сравнивается по форме
```

Объект с **большим** набором полей совместим с типом, где полей меньше:

```ts
type Named = { name: string };
const user = { name: 'Анна', age: 30 };
const named: Named = user; // ок
```

## Проверка лишних свойств

Но для **свежего объектного литерала** TypeScript включает дополнительную проверку:

```ts
const named2: Named = { name: 'Анна', age: 30 }; // ошибка: 'age' does not exist in type 'Named'
```

Это эвристика против опечаток: литерал создаётся прямо здесь, и лишнее поле почти наверняка ошибка. Через промежуточную переменную проверка не срабатывает.

## Вариантность

- **Ковариантность**: если `Dog` — подтип `Animal`, то `Dog[]` — подтип `Animal[]`. Возвращаемые значения функций ковариантны.
- **Контравариантность**: параметры функций — наоборот. Функция, принимающая `Animal`, подходит туда, где ждут функцию от `Dog`, но не наоборот.

```ts
type Animal = { name: string };
type Dog = Animal & { bark(): void };

let handleAnimal = (a: Animal) => {};
let handleDog = (d: Dog) => d.bark();

handleDog = handleAnimal; // ок: справится с любой собакой
handleAnimal = handleDog; // ошибка под strictFunctionTypes: не каждое животное умеет лаять
```

> [!WARNING]
> Массивы в TypeScript ковариантны и изменяемы — это осознанная дыра в системе типов:
> ```ts
> const dogs: Dog[] = [];
> const animals: Animal[] = dogs; // разрешено
> animals.push({ name: 'кот' }); // теперь в dogs лежит не собака
> ```
> Используйте `readonly Dog[]` для входных параметров — так запись станет невозможной.

Методы, объявленные через сокращённый синтаксис `method(arg: T): void`, проверяются **бивариантно** даже в strict-режиме, а свойства-функции `method: (arg: T) => void` — контравариантно. Это ещё одна причина предпочитать вторую запись в типах.

## as const

```ts
const ROUTES = {
  home: '/',
  profile: '/profile',
} as const;
// { readonly home: '/'; readonly profile: '/profile' }

type Route = (typeof ROUTES)[keyof typeof ROUTES]; // '/' | '/profile'

const LEVELS = ['basic', 'middle', 'advanced'] as const;
type Level = (typeof LEVELS)[number]; // 'basic' | 'middle' | 'advanced'
```

`as const` делает литерал глубоко `readonly` и сохраняет литеральные типы вместо расширения до `string`. Это способ получить и значение для рантайма, и тип из одного источника — замена `enum`.

## satisfies

Аннотация `const x: T = ...` проверяет значение, но **расширяет** тип до `T`. `as T` не проверяет вообще. `satisfies T` проверяет и сохраняет точный тип:

```ts
type Theme = Record<'primary' | 'danger', string | [number, number, number]>;

const annotated: Theme = { primary: '#2450b8', danger: [180, 35, 53] };
annotated.primary.toUpperCase(); // ошибка: string | [number, number, number]

const checked = { primary: '#2450b8', danger: [180, 35, 53] } satisfies Theme;
checked.primary.toUpperCase(); // ок: тип 'primary' — string
checked.danger[0]; // ок: number

const typo = { primry: '#fff', danger: '#f00' } satisfies Theme; // ошибка: опечатка найдена
```

Сочетание `as const satisfies T` — проверка формы плюс максимально узкие литеральные типы. Так на этой платформе описаны треки каталога.

## Branded types

Структурная типизация не отличает `userId` от `orderId` — оба `string`:

```ts
function cancelOrder(orderId: string) {}
cancelOrder(user.id); // компилируется, но это баг
```

Решение — «брендировать» примитив фантомным полем:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

// Единственное место, где создаётся бренд, — «умный конструктор» с проверкой
function toOrderId(raw: string): OrderId {
  if (!/^ord_[a-z0-9]+$/.test(raw)) throw new Error(`Некорректный id заказа: ${raw}`);
  return raw as OrderId;
}

function cancelOrder2(id: OrderId) {}

cancelOrder2(toOrderId('ord_42')); // ок
cancelOrder2('ord_42'); // ошибка: string не OrderId
cancelOrder2(userId); // ошибка: UserId не OrderId
```

Тот же приём для единиц измерения: `Brand<number, 'Ms'>` и `Brand<number, 'Seconds'>` нельзя перепутать.

> [!INTERVIEW]
> «Чем `satisfies` отличается от аннотации типа и от `as`?» — Аннотация проверяет совместимость и заменяет тип переменной на указанный (теряются литералы). `as` ничего не проверяет (только явную несовместимость) и просто меняет тип. `satisfies` проверяет значение на соответствие типу, но оставляет переменной её выведенный, более точный тип.

## any и unknown в совместимости

- `any` совместим со всем в обе стороны — поэтому он «выключает» систему типов.
- В `unknown` можно присвоить что угодно, но `unknown` можно присвоить только в `unknown` и `any`.
- `never` присваивается во что угодно, а в `never` нельзя присвоить ничего, кроме `never`.

## Коротко

- Совместимость структурная: решает форма, а не имя.
- Свежие литералы дополнительно проверяются на лишние свойства.
- Параметры функций контравариантны (при `strictFunctionTypes`), массивы — ковариантны и небезопасны для записи.
- `as const` — узкие readonly-литералы, `satisfies` — проверка без расширения типа.
- Branded types отличают одинаковые примитивы с разным смыслом.
