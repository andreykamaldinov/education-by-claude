`this` в JavaScript определяется не местом объявления функции, а **способом её вызова**. Это главное отличие от Java или C#, и главный источник багов вида «Cannot read properties of undefined». Есть четыре правила и одно исключение — стрелочные функции.

## Правило 1. Вызов как функции (default binding)

```js
'use strict';

function show() {
  return this;
}

show(); // undefined (в нестрогом режиме — globalThis)
```

В модулях и классах strict mode включён всегда, поэтому на практике «потерянный» `this` равен `undefined`.

## Правило 2. Вызов как метода (implicit binding)

`this` — объект **слева от точки** в момент вызова:

```js
const user = {
  name: 'Анна',
  greet() {
    return `Привет, ${this.name}`;
  },
};

user.greet(); // 'Привет, Анна'
```

### Потеря контекста

Если метод извлечь из объекта, «точки» при вызове больше нет:

```js
const greet = user.greet;
greet(); // TypeError: Cannot read properties of undefined (reading 'name')

setTimeout(user.greet, 0); // та же проблема: таймер вызовет функцию без объекта
button.addEventListener('click', user.greet); // this будет button
```

## Правило 3. Явная привязка: call, apply, bind

```js
function introduce(greeting, punctuation) {
  return `${greeting}, я ${this.name}${punctuation}`;
}

const anna = { name: 'Анна' };

introduce.call(anna, 'Привет', '!'); // аргументы через запятую
introduce.apply(anna, ['Привет', '!']); // аргументы массивом

const bound = introduce.bind(anna, 'Здравствуйте');
bound('.'); // 'Здравствуйте, я Анна.'
```

| Метод | Вызывает сразу | Аргументы | Возвращает |
| --- | --- | --- | --- |
| `call` | да | списком | результат функции |
| `apply` | да | массивом | результат функции |
| `bind` | нет | частично, списком | новую функцию с жёстким `this` |

> [!NOTE]
> Функцию, полученную через `bind`, нельзя «перепривязать»: повторный `bind` или `call` не изменит `this`. Исключение — вызов через `new`.

## Правило 4. Вызов через new

```js
function User(name) {
  // this = {} — новый объект, его [[Prototype]] = User.prototype
  this.name = name;
  // return this — неявно
}

const u = new User('Анна');
```

`new` делает четыре шага: создаёт пустой объект, связывает его прототип с `User.prototype`, вызывает функцию с `this` = новый объект и возвращает его (если функция сама не вернула объект).

## Приоритет правил

От сильного к слабому: `new` → `bind`/`call`/`apply` → вызов как метода → обычный вызов.

## Стрелочные функции

У стрелки **нет собственного `this`**. Она берёт `this` из окружающей лексической области в момент создания — как обычную переменную через замыкание. `call`, `apply` и `bind` не могут его изменить.

```js
class Timer {
  seconds = 0;

  start() {
    setInterval(() => {
      this.seconds++; // this — экземпляр Timer, взят из метода start
    }, 1000);
  }

  startBroken() {
    setInterval(function () {
      this.seconds++; // this = undefined: функция вызвана таймером без контекста
    }, 1000);
  }
}
```

Также у стрелок нет `arguments`, `super`, `new.target`, их нельзя вызывать через `new`, и у них нет `prototype`.

> [!WARNING]
> Не используйте стрелку как метод объекта-литерала, если нужен доступ к объекту: `const obj = { name: 'x', get: () => this.name }` — здесь `this` берётся из внешней области (модуля), а не из `obj`.

## this в классах и Angular

В Angular обработчики из шаблона вызываются в контексте компонента, поэтому `(click)="save()"` работает. Проблемы начинаются, когда метод передаётся как колбэк:

```ts
@Component({ /* ... */ })
export class SearchComponent {
  private readonly api = inject(SearchApi);

  // Плохо: this внутри будет undefined, если метод вызовет сторонний код
  onResult(result: Result) {
    this.store.save(result);
  }

  ngOnInit() {
    this.api.search('q').subscribe(this.onResult); // контекст потерян
    this.api.search('q').subscribe((result) => this.onResult(result)); // корректно
  }

  // Альтернатива: поле класса со стрелкой — this привязан к экземпляру
  readonly onResultBound = (result: Result) => this.store.save(result);
}
```

Поле-стрелка создаётся для каждого экземпляра отдельно (в отличие от метода в прототипе), что немного дороже по памяти, но удобно для колбэков.

> [!INTERVIEW]
> «Что выведет код?»
> ```js
> const obj = {
>   name: 'obj',
>   regular() { return this.name; },
>   arrow: () => this?.name,
>   nested() { return [1].map(function () { return this?.name; }); },
>   nestedArrow() { return [1].map(() => this.name); },
> };
> ```
> `obj.regular()` → `'obj'`; `obj.arrow()` → `undefined` (this модуля); `obj.nested()` → `[undefined]` (обычная функция, вызванная `map` без контекста); `obj.nestedArrow()` → `['obj']` (стрелка взяла this из `nestedArrow`).

## Реализуем bind сами

Частая задача на собеседовании, проверяет понимание `this`, `apply` и замыканий:

```js
Function.prototype.myBind = function (context, ...boundArgs) {
  const fn = this; // функция, у которой вызвали myBind
  return function (...args) {
    return fn.apply(context, [...boundArgs, ...args]);
  };
};
```

## Коротко

- `this` определяется способом вызова, а не местом объявления.
- Четыре правила: обычный вызов, метод, `call/apply/bind`, `new`.
- Передача метода как колбэка теряет контекст — оборачивайте в стрелку или используйте `bind`.
- Стрелки берут `this` лексически и не позволяют его изменить.
