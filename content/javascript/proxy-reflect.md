`Proxy` позволяет перехватывать базовые операции над объектом: чтение и запись свойств, удаление, вызов функции, оператор `in`. `Reflect` — набор функций, выполняющих эти операции «по умолчанию». Вместе они — инструмент метапрограммирования, на котором построены реактивность Vue 3, MobX, Immer и многие ORM.

## Базовый Proxy

```js
const target = { name: 'Анна', age: 30 };

const logged = new Proxy(target, {
  get(obj, prop, receiver) {
    console.log(`чтение ${String(prop)}`);
    return Reflect.get(obj, prop, receiver);
  },
  set(obj, prop, value, receiver) {
    console.log(`запись ${String(prop)} = ${value}`);
    return Reflect.set(obj, prop, value, receiver);
  },
});

logged.name; // чтение name
logged.age = 31; // запись age = 31
```

Функции-обработчики называются **ловушками** (traps). Всего их 13:

| Ловушка | Перехватывает |
| --- | --- |
| `get` / `set` | чтение и запись свойства |
| `has` | оператор `in` |
| `deleteProperty` | `delete obj.prop` |
| `ownKeys` | `Object.keys`, `for...in`, `Reflect.ownKeys` |
| `getOwnPropertyDescriptor`, `defineProperty` | работа с дескрипторами |
| `apply` | вызов функции |
| `construct` | `new` |
| `getPrototypeOf`, `setPrototypeOf`, `isExtensible`, `preventExtensions` | работа с прототипом и расширяемостью |

## Зачем нужен Reflect

У каждой ловушки есть одноимённый метод `Reflect`, принимающий те же аргументы. Он выполняет стандартное поведение и корректно передаёт `receiver` — объект, через который шло обращение. Это важно для геттеров и наследования:

```js
const user = {
  _name: 'Анна',
  get name() {
    return this._name;
  },
};

const proxy = new Proxy(user, {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver); // this в геттере = receiver (proxy)
  },
});
```

Если написать `target[prop]`, геттер выполнится с `this = target` и обойдёт прокси для вложенных обращений.

Кроме того, `Reflect.set` и `Reflect.defineProperty` возвращают `true/false` вместо исключения — удобно возвращать из ловушки результат как есть.

## Валидация

```js
const createValidated = (schema) =>
  new Proxy(
    {},
    {
      set(target, prop, value) {
        const check = schema[prop];
        if (check && !check(value)) {
          throw new TypeError(`Недопустимое значение для ${String(prop)}: ${value}`);
        }
        return Reflect.set(target, prop, value);
      },
    },
  );

const person = createValidated({ age: (v) => Number.isInteger(v) && v >= 0 });
person.age = 25; // ок
person.age = -1; // TypeError
```

## Реактивность на Proxy

Упрощённая модель того, как работают Vue 3 и подобные системы: при чтении запоминаем, кто читал, при записи — оповещаем.

```js
let activeEffect = null;
const subscribers = new Map(); // prop → Set<effect>

function reactive(obj) {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (activeEffect) {
        if (!subscribers.has(prop)) subscribers.set(prop, new Set());
        subscribers.get(prop).add(activeEffect);
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      subscribers.get(prop)?.forEach((effect) => effect());
      return result;
    },
  });
}

function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

const state = reactive({ count: 0 });
effect(() => console.log('count =', state.count)); // count = 0
state.count++; // count = 1
```

> [!NOTE]
> Angular Signals устроены по той же идее «отслеживать чтения», но без Proxy: зависимость регистрируется при вызове `signal()` внутри реактивного контекста (`computed`, `effect`, шаблон). Явный вызов-функция даёт предсказуемость и работает с любыми значениями, включая примитивы. Подробнее — [Signals](/tracks/angular/signals).

## Ограничения Proxy

- Прокси — отдельный объект: `proxy !== target`. Сравнения по ссылке и `WeakMap` с ключом-целью ведут себя иначе.
- Встроенные объекты с внутренними слотами (`Map`, `Set`, `Date`, приватные `#поля` классов) ломаются: `new Proxy(new Map(), {}).get('x')` бросит `TypeError`, потому что метод вызывается с `this = proxy`. Решение — привязывать методы к цели в ловушке `get`.
- Есть накладные расходы на каждую операцию — не оборачивайте горячие структуры данных без необходимости.
- Инварианты: ловушка не может «соврать» о несконфигурируемых свойствах цели — движок бросит `TypeError`.

## Отзываемый прокси

```js
const { proxy, revoke } = Proxy.revocable(api, {});
giveAccess(proxy);
revoke(); // любое обращение к proxy теперь бросает TypeError
```

Полезно для выдачи временного доступа к объекту стороннему коду.

## Symbol

Символы — уникальные идентификаторы, часто используемые в метапрограммировании.

```js
const id = Symbol('id');
const user = { [id]: 42, name: 'Анна' };

Object.keys(user); // ['name'] — символы не перечисляются обычными методами
user[id]; // 42
Symbol('id') === Symbol('id'); // false
Symbol.for('app.id') === Symbol.for('app.id'); // true — глобальный реестр
```

**Well-known symbols** позволяют настроить поведение объекта в языковых конструкциях:

| Символ | Что настраивает |
| --- | --- |
| `Symbol.iterator` | `for...of`, spread |
| `Symbol.asyncIterator` | `for await...of` |
| `Symbol.toPrimitive` | приведение к примитиву |
| `Symbol.hasInstance` | поведение `instanceof` |
| `Symbol.toStringTag` | результат `Object.prototype.toString` |
| `Symbol.dispose` / `Symbol.asyncDispose` | объявления `using` (явное управление ресурсами) |

```js
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }
  get [Symbol.toStringTag]() {
    return 'Temperature';
  }
}
String(new Temperature(20)); // '[object Temperature]'
```

## Коротко

- `Proxy` перехватывает операции над объектом через 13 ловушек.
- `Reflect` выполняет операцию по умолчанию и корректно передаёт `receiver`.
- Применения: валидация, логирование, реактивность, ленивая загрузка, контроль доступа.
- Прокси плохо дружит с `Map`, `Set` и `#private` полями.
- Символы — уникальные ключи; well-known symbols настраивают поведение языка.
