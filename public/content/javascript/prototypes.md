JavaScript — язык с прототипным наследованием. Классы появились в ES2015, но под капотом это всё те же прототипы. Понимание цепочки прототипов объясняет, откуда у массива метод `map`, как работает `instanceof` и почему методы класса не копируются в каждый экземпляр.

## Цепочка прототипов

У каждого объекта есть скрытая ссылка `[[Prototype]]` на другой объект (или `null`). Если свойства нет в самом объекте, движок ищет его в прототипе, потом в прототипе прототипа — и так до `null`.

```js
const animal = {
  eats: true,
  walk() {
    return `${this.name} идёт`;
  },
};

const rabbit = Object.create(animal); // [[Prototype]] = animal
rabbit.name = 'Кролик';

rabbit.eats; // true — найдено в прототипе
rabbit.walk(); // 'Кролик идёт' — this = rabbit, метод из прототипа
Object.getPrototypeOf(rabbit) === animal; // true
```

```text
rabbit ──▶ animal ──▶ Object.prototype ──▶ null
 name        eats        toString
             walk        hasOwnProperty
```

Запись идёт всегда в сам объект: `rabbit.eats = false` создаст собственное свойство и **затенит** прототипное, не меняя `animal`.

## prototype и __proto__: в чём разница

Эту пару путают чаще всего.

- `obj.__proto__` (устаревший доступ) или `Object.getPrototypeOf(obj)` — **прототип конкретного объекта**.
- `Fn.prototype` — обычное свойство **функции-конструктора**. Объект, который станет прототипом всех экземпляров, созданных через `new Fn()`.

```js
function User(name) {
  this.name = name;
}
User.prototype.sayHi = function () {
  return `Привет, ${this.name}`;
};

const u = new User('Анна');

Object.getPrototypeOf(u) === User.prototype; // true
User.prototype.constructor === User; // true
u.sayHi === new User('Олег').sayHi; // true — метод один на всех
```

> [!INTERVIEW]
> «Чем `__proto__` отличается от `prototype`?» — `__proto__` есть у любого объекта и указывает на его прототип. `prototype` есть у функций (кроме стрелок и методов) и используется только оператором `new`: он становится `__proto__` созданного объекта. Современный API — `Object.getPrototypeOf` / `Object.setPrototypeOf` / `Object.create`.

## Классы — синтаксис поверх прототипов

```js
class Animal {
  #energy = 10; // приватное поле, живёт в экземпляре
  static kingdom = 'Animalia'; // свойство самого класса

  constructor(name) {
    this.name = name; // собственное свойство экземпляра
  }

  walk() {
    // метод попадает в Animal.prototype
    this.#energy--;
    return `${this.name} идёт`;
  }

  get energy() {
    return this.#energy;
  }
}

class Rabbit extends Animal {
  constructor(name, earLength) {
    super(name); // обязательно до обращения к this
    this.earLength = earLength;
  }

  walk() {
    return `${super.walk()} вприпрыжку`; // вызов метода родителя
  }
}

const r = new Rabbit('Кролик', 12);
r.walk(); // 'Кролик идёт вприпрыжку'
```

Что делает `extends`:

```text
r ──▶ Rabbit.prototype ──▶ Animal.prototype ──▶ Object.prototype ──▶ null
Rabbit ──▶ Animal   (статические свойства тоже наследуются)
```

Отличия класса от функции-конструктора:

- класс нельзя вызвать без `new` — будет `TypeError`;
- код класса всегда в strict mode;
- методы класса неперечисляемые (не попадают в `for...in`);
- объявление класса находится в TDZ, как `let`;
- есть настоящие приватные поля `#field`, недоступные даже через прототип.

## instanceof и проверки

`a instanceof B` проходит по цепочке прототипов `a` и ищет `B.prototype`:

```js
r instanceof Rabbit; // true
r instanceof Animal; // true
r instanceof Object; // true

Object.hasOwn(r, 'name'); // true — собственное свойство
Object.hasOwn(r, 'walk'); // false — из прототипа
'walk' in r; // true — in смотрит всю цепочку
```

## Объекты без прототипа

`Object.create(null)` создаёт «чистый» словарь без унаследованных `toString`, `constructor` и `__proto__`. Это защищает от коллизий ключей и от **prototype pollution**:

```js
const dict = Object.create(null);
dict['__proto__'] = 'безопасно'; // просто ключ
```

Ещё лучше для словарей — `Map`.

> [!WARNING]
> Prototype pollution — уязвимость, когда злоумышленник через JSON вида `{"__proto__": {"isAdmin": true}}` и небезопасное глубокое слияние меняет `Object.prototype`, и `isAdmin` появляется у всех объектов приложения. Не пишите рекурсивный merge без фильтрации ключей `__proto__`, `constructor`, `prototype`.

## Не расширяйте встроенные прототипы

```js
Array.prototype.last = function () {
  return this[this.length - 1];
};
```

Так делали библиотеки 2000-х (Prototype.js, MooTools), и из-за этого TC39 до сих пор вынужден выбирать странные имена (`flat` вместо `flatten`, `includes` вместо `contains`). Пишите утилиты отдельными функциями.

## Производительность

Движки оптимизируют доступ к свойствам через **скрытые классы** (shapes). Объекты одной «формы» обрабатываются быстро. Смена прототипа через `Object.setPrototypeOf` на лету ломает эти оптимизации — используйте её только в крайних случаях.

## Коротко

- Каждый объект ссылается на прототип; поиск свойств идёт по цепочке до `null`.
- `prototype` — свойство конструктора, `[[Prototype]]` — связь конкретного объекта.
- Классы — сахар над прототипами с удобствами: `extends`, `super`, `#private`, `static`.
- Методы живут в прототипе, данные — в экземпляре.
- `instanceof` ищет `Constructor.prototype` в цепочке.
