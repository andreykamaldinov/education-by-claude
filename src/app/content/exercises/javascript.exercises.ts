import type { Exercise } from '../../domain/exercise.model';

/*
 * Code strings (starter, solution, tests) avoid template literals on purpose:
 * they live inside TypeScript template strings here.
 */

export const JAVASCRIPT_EXERCISES = [
  {
    id: 'js-debounce',
    trackId: 'javascript',
    title: 'Реализуйте debounce',
    level: 'basic',
    language: 'javascript',
    relatedLessonId: 'closures',
    description: `Напишите функцию \`debounce(fn, ms)\`. Она возвращает новую функцию, которая откладывает вызов \`fn\` до тех пор, пока с момента **последнего** вызова не пройдёт \`ms\` миллисекунд.

- Если обёртку вызвали несколько раз подряд, \`fn\` выполнится один раз — с аргументами последнего вызова.
- Контекст \`this\` должен передаваться в \`fn\`.

~~~js
const log = debounce((q) => console.log(q), 100);
log('a'); log('ab'); log('abc');
// через 100 мс: 'abc'
~~~`,
    starter: `function debounce(fn, ms) {
  // ваш код
}
`,
    solution: `function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
`,
    tests: [
      {
        name: 'вызывает функцию один раз после серии вызовов',
        code: `const calls = spy();
const debounced = debounce(calls, 30);
debounced(1); debounced(2); debounced(3);
expect(calls.calls).toHaveLength(0);
await sleep(60);
expect(calls.calls).toEqual([[3]]);`,
      },
      {
        name: 'повторная серия после паузы вызывает функцию снова',
        code: `const calls = spy();
const debounced = debounce(calls, 20);
debounced('a');
await sleep(40);
debounced('b');
await sleep(40);
expect(calls.calls).toEqual([['a'], ['b']]);`,
      },
      {
        name: 'сохраняет контекст this',
        code: `const obj = { value: 42, read: null, result: null };
obj.read = debounce(function () { obj.result = this.value; }, 10);
obj.read();
await sleep(30);
expect(obj.result).toBe(42);`,
      },
    ],
    hints: [
      'Таймер должен жить в замыкании и переживать вызовы обёртки.',
      'При каждом вызове сбрасывайте предыдущий таймер через clearTimeout.',
      'Чтобы сохранить this, возвращайте обычную function, а внутри setTimeout используйте стрелку и fn.apply(this, args).',
    ],
  },
  {
    id: 'js-throttle',
    trackId: 'javascript',
    title: 'Реализуйте throttle',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'closures',
    description: `Напишите \`throttle(fn, ms)\`: обёртка вызывает \`fn\` **сразу** при первом вызове, а затем игнорирует вызовы, пока не пройдёт \`ms\` миллисекунд.

После окончания окна следующий вызов снова выполняется сразу.`,
    starter: `function throttle(fn, ms) {
  // ваш код
}
`,
    solution: `function throttle(fn, ms) {
  let lastCall = -Infinity;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}
`,
    tests: [
      {
        name: 'первый вызов выполняется сразу',
        code: `const calls = spy();
const throttled = throttle(calls, 50);
throttled('a');
expect(calls.calls).toEqual([['a']]);`,
      },
      {
        name: 'вызовы внутри окна игнорируются',
        code: `const calls = spy();
const throttled = throttle(calls, 50);
throttled(1); throttled(2); throttled(3);
expect(calls.calls).toEqual([[1]]);`,
      },
      {
        name: 'после окна вызов снова проходит',
        code: `const calls = spy();
const throttled = throttle(calls, 30);
throttled(1);
await sleep(50);
throttled(2);
expect(calls.calls).toEqual([[1], [2]]);`,
      },
    ],
    hints: ['Храните время последнего успешного вызова в замыкании.', 'Date.now() — текущее время в миллисекундах.'],
  },
  {
    id: 'js-promise-all',
    trackId: 'javascript',
    title: 'Свой Promise.all',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'promises',
    description: `Реализуйте \`promiseAll(items)\` — аналог \`Promise.all\`:

- принимает массив промисов **и обычных значений**;
- возвращает промис с массивом результатов **в исходном порядке** (не в порядке завершения);
- отклоняется с первой ошибкой;
- для пустого массива сразу разрешается \`[]\`.

Использовать \`Promise.all\`, \`allSettled\`, \`any\`, \`race\` нельзя.`,
    starter: `function promiseAll(items) {
  // ваш код
}
`,
    solution: `function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) {
      resolve(results);
      return;
    }
    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value;
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);
    });
  });
}
`,
    tests: [
      {
        name: 'сохраняет порядок результатов',
        code: `const slow = new Promise((r) => setTimeout(() => r('медленно'), 30));
const fast = new Promise((r) => setTimeout(() => r('быстро'), 5));
expect(await promiseAll([slow, fast])).toEqual(['медленно', 'быстро']);`,
      },
      {
        name: 'принимает обычные значения',
        code: `expect(await promiseAll([1, Promise.resolve(2), 3])).toEqual([1, 2, 3]);`,
      },
      {
        name: 'пустой массив разрешается сразу',
        code: `expect(await promiseAll([])).toEqual([]);`,
      },
      {
        name: 'отклоняется с первой ошибкой',
        code: `let message = '';
try {
  await promiseAll([Promise.resolve(1), Promise.reject(new Error('сбой')), new Promise(() => {})]);
} catch (e) {
  message = e.message;
}
expect(message).toBe('сбой');`,
      },
      {
        name: 'не использует встроенный Promise.all',
        code: `const original = Promise.all;
Promise.all = () => { throw new Error('Promise.all запрещён'); };
try {
  expect(await promiseAll([1, 2])).toEqual([1, 2]);
} finally {
  Promise.all = original;
}`,
      },
    ],
    hints: [
      'Создайте массив результатов нужной длины и счётчик оставшихся промисов.',
      'Promise.resolve(item) превращает обычное значение в промис.',
      'Записывайте результат по индексу: results[index] = value.',
    ],
  },
  {
    id: 'js-memoize',
    trackId: 'javascript',
    title: 'Мемоизация функции',
    level: 'basic',
    language: 'javascript',
    relatedLessonId: 'closures',
    description: `Напишите \`memoize(fn)\`, которая кеширует результаты \`fn\` по аргументам.

- Повторный вызов с теми же аргументами не должен вызывать \`fn\`.
- Аргументы — примитивы (числа, строки), их может быть несколько.
- У возвращённой функции должен быть метод \`clear()\`, очищающий кеш.`,
    starter: `function memoize(fn) {
  // ваш код
}
`,
    solution: `function memoize(fn) {
  const cache = new Map();
  const memoized = function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
  memoized.clear = () => cache.clear();
  return memoized;
}
`,
    tests: [
      {
        name: 'кеширует результат',
        code: `const square = spy((n) => n * n);
const fast = memoize(square);
expect(fast(4)).toBe(16);
expect(fast(4)).toBe(16);
expect(square.calls).toHaveLength(1);`,
      },
      {
        name: 'различает разные наборы аргументов',
        code: `const add = spy((a, b) => a + b);
const fast = memoize(add);
fast(1, 2); fast(2, 1); fast(1, 2);
expect(add.calls).toHaveLength(2);`,
      },
      {
        name: 'clear() очищает кеш',
        code: `const id = spy((x) => x);
const fast = memoize(id);
fast('a');
fast.clear();
fast('a');
expect(id.calls).toHaveLength(2);`,
      },
    ],
    hints: ['Map в замыкании — удобное хранилище кеша.', 'Ключ для нескольких аргументов можно получить через JSON.stringify(args).'],
  },
  {
    id: 'js-deep-equal',
    trackId: 'javascript',
    title: 'Глубокое сравнение',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'types-and-coercion',
    description: `Напишите \`deepEqual(a, b)\`, которая сравнивает значения структурно:

- примитивы — как \`Object.is\` (значит, \`NaN\` равен \`NaN\`);
- массивы — по длине и элементам;
- обычные объекты — по набору собственных ключей и значениям (порядок ключей не важен);
- \`Date\` — по времени.`,
    starter: `function deepEqual(a, b) {
  // ваш код
}
`,
    solution: `function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}
`,
    tests: [
      { name: 'примитивы и NaN', code: `expect(deepEqual(1, 1)).toBe(true);
expect(deepEqual('a', 'b')).toBe(false);
expect(deepEqual(NaN, NaN)).toBe(true);
expect(deepEqual(0, '0')).toBe(false);` },
      { name: 'вложенные объекты и массивы', code: `expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false);` },
      { name: 'порядок ключей не важен', code: `expect(deepEqual({ x: 1, y: 2 }, { y: 2, x: 1 })).toBe(true);` },
      { name: 'разное количество ключей', code: `expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);` },
      { name: 'массив не равен объекту', code: `expect(deepEqual([1], { 0: 1 })).toBe(false);` },
      { name: 'даты сравниваются по времени', code: `expect(deepEqual(new Date(5), new Date(5))).toBe(true);
expect(deepEqual(new Date(5), new Date(6))).toBe(false);` },
    ],
    hints: ['Начните с Object.is для примитивов.', 'Для объектов сравните количество ключей, затем рекурсивно — значения.', 'Не забудьте отличить массив от объекта через Array.isArray.'],
  },
  {
    id: 'js-deep-clone',
    trackId: 'javascript',
    title: 'Глубокое копирование',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'immutability',
    description: `Реализуйте \`deepClone(value)\` без \`structuredClone\` и JSON:

- копирует объекты, массивы, \`Date\`, \`Map\`, \`Set\` на любую глубину;
- поддерживает **циклические ссылки** (копия должна ссылаться сама на себя так же, как оригинал);
- примитивы возвращает как есть.`,
    starter: `function deepClone(value) {
  // ваш код
}
`,
    solution: `function deepClone(value, seen = new Map()) {
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    value.forEach((v, k) => copy.set(deepClone(k, seen), deepClone(v, seen)));
    return copy;
  }
  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => copy.add(deepClone(v, seen)));
    return copy;
  }
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}
`,
    tests: [
      { name: 'вложенные объекты копируются', code: `const original = { a: { b: [1, 2] } };
const copy = deepClone(original);
copy.a.b.push(3);
expect(original.a.b).toEqual([1, 2]);
expect(copy).not.toBe(original);` },
      { name: 'Date, Map и Set', code: `const original = { d: new Date(10), m: new Map([['k', { v: 1 }]]), s: new Set([1, 2]) };
const copy = deepClone(original);
expect(copy.d).toBeInstanceOf(Date);
expect(copy.d.getTime()).toBe(10);
expect(copy.d).not.toBe(original.d);
expect(copy.m.get('k')).toEqual({ v: 1 });
expect(copy.m.get('k')).not.toBe(original.m.get('k'));
expect(copy.s.has(2)).toBe(true);` },
      { name: 'циклические ссылки', code: `const node = { name: 'root' };
node.self = node;
const copy = deepClone(node);
expect(copy.self).toBe(copy);
expect(copy).not.toBe(node);` },
      { name: 'примитивы возвращаются как есть', code: `expect(deepClone(5)).toBe(5);
expect(deepClone(null)).toBe(null);
expect(deepClone('x')).toBe('x');` },
    ],
    hints: ['Для циклов нужна карта «оригинал → копия» (Map), передаваемая в рекурсию.', 'Запишите копию в карту до обхода её содержимого.'],
  },
  {
    id: 'js-curry',
    trackId: 'javascript',
    title: 'Каррирование',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'closures',
    description: `Напишите \`curry(fn)\`. Каррированная функция накапливает аргументы, пока их не станет не меньше \`fn.length\`, и тогда вызывает \`fn\`.

~~~js
const sum3 = curry((a, b, c) => a + b + c);
sum3(1)(2)(3); // 6
sum3(1, 2)(3); // 6
sum3(1)(2, 3); // 6
~~~`,
    starter: `function curry(fn) {
  // ваш код
}
`,
    solution: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}
`,
    tests: [
      { name: 'по одному аргументу', code: `const sum3 = curry((a, b, c) => a + b + c);
expect(sum3(1)(2)(3)).toBe(6);` },
      { name: 'группами аргументов', code: `const sum3 = curry((a, b, c) => a + b + c);
expect(sum3(1, 2)(3)).toBe(6);
expect(sum3(1)(2, 3)).toBe(6);
expect(sum3(1, 2, 3)).toBe(6);` },
      { name: 'частичное применение переиспользуется', code: `const greet = curry((greeting, name) => greeting + ', ' + name);
const hello = greet('Привет');
expect(hello('Анна')).toBe('Привет, Анна');
expect(hello('Олег')).toBe('Привет, Олег');` },
    ],
    hints: ['fn.length — количество объявленных параметров функции.', 'Если аргументов недостаточно, верните функцию, которая склеит старые и новые аргументы.'],
  },
  {
    id: 'js-bind',
    trackId: 'javascript',
    title: 'Полифил bind',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'this-binding',
    description: `Добавьте в \`Function.prototype\` метод \`myBind(context, ...args)\`, работающий как стандартный \`bind\`:

- возвращает новую функцию с жёстко привязанным \`this\`;
- поддерживает частичное применение аргументов;
- нельзя использовать встроенный \`bind\`.`,
    starter: `Function.prototype.myBind = function (context, ...boundArgs) {
  // ваш код
};
`,
    solution: `Function.prototype.myBind = function (context, ...boundArgs) {
  const fn = this;
  return function (...args) {
    return fn.apply(context, [...boundArgs, ...args]);
  };
};
`,
    tests: [
      { name: 'привязывает this', code: `const user = { name: 'Анна' };
function getName() { return this.name; }
expect(getName.myBind(user)()).toBe('Анна');` },
      { name: 'частичное применение', code: `function sum(a, b, c) { return a + b + c; }
const add10 = sum.myBind(null, 10);
expect(add10(1, 2)).toBe(13);` },
      { name: 'контекст не теряется при передаче как колбэк', code: `const counter = { count: 0, inc() { this.count += 1; } };
const inc = counter.inc.myBind(counter);
[1, 2, 3].forEach(() => inc());
expect(counter.count).toBe(3);` },
      { name: 'не использует встроенный bind', code: `const original = Function.prototype.bind;
Function.prototype.bind = function () { throw new Error('bind запрещён'); };
try {
  function f() { return this.x; }
  expect(f.myBind({ x: 1 })()).toBe(1);
} finally {
  Function.prototype.bind = original;
}` },
    ],
    hints: ['Внутри myBind this — это функция, у которой вызвали метод.', 'Используйте fn.apply(context, args).'],
  },
  {
    id: 'js-event-emitter',
    trackId: 'javascript',
    title: 'EventEmitter',
    level: 'basic',
    language: 'javascript',
    relatedLessonId: 'dom-events',
    description: `Реализуйте класс \`EventEmitter\` с методами:

- \`on(event, handler)\` — подписка, возвращает функцию отписки;
- \`off(event, handler)\` — отписка;
- \`once(event, handler)\` — обработчик сработает один раз;
- \`emit(event, ...args)\` — вызвать обработчики события в порядке подписки, вернуть \`true\`, если обработчики были.`,
    starter: `class EventEmitter {
  // ваш код
}
`,
    solution: `class EventEmitter {
  #handlers = new Map();

  on(event, handler) {
    const list = this.#handlers.get(event) ?? [];
    list.push(handler);
    this.#handlers.set(event, list);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const list = this.#handlers.get(event);
    if (!list) return;
    this.#handlers.set(event, list.filter((h) => h !== handler && h.original !== handler));
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    wrapper.original = handler;
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const list = this.#handlers.get(event);
    if (!list || list.length === 0) return false;
    [...list].forEach((handler) => handler(...args));
    return true;
  }
}
`,
    tests: [
      { name: 'on и emit', code: `const bus = new EventEmitter();
const handler = spy();
bus.on('save', handler);
expect(bus.emit('save', 1, 2)).toBe(true);
expect(handler.calls).toEqual([[1, 2]]);` },
      { name: 'emit без подписчиков возвращает false', code: `expect(new EventEmitter().emit('nothing')).toBe(false);` },
      { name: 'отписка через возвращённую функцию и off', code: `const bus = new EventEmitter();
const a = spy();
const b = spy();
const unsubscribe = bus.on('x', a);
bus.on('x', b);
unsubscribe();
bus.off('x', b);
bus.emit('x');
expect(a.calls).toHaveLength(0);
expect(b.calls).toHaveLength(0);` },
      { name: 'once срабатывает один раз', code: `const bus = new EventEmitter();
const handler = spy();
bus.once('ready', handler);
bus.emit('ready', 'a');
bus.emit('ready', 'b');
expect(handler.calls).toEqual([['a']]);` },
      { name: 'порядок вызова — порядок подписки', code: `const bus = new EventEmitter();
const order = [];
bus.on('e', () => order.push(1));
bus.on('e', () => order.push(2));
bus.emit('e');
expect(order).toEqual([1, 2]);` },
    ],
    hints: ['Храните Map: имя события → массив обработчиков.', 'once можно реализовать обёрткой, которая отписывает себя перед вызовом.'],
  },
  {
    id: 'js-flatten',
    trackId: 'javascript',
    title: 'Flatten с глубиной',
    level: 'basic',
    language: 'javascript',
    relatedLessonId: 'modern-features',
    description: `Реализуйте \`flatten(array, depth = 1)\` — аналог \`Array.prototype.flat\` без его использования.

~~~js
flatten([1, [2, [3, [4]]]]); // [1, 2, [3, [4]]]
flatten([1, [2, [3, [4]]]], Infinity); // [1, 2, 3, 4]
~~~`,
    starter: `function flatten(array, depth = 1) {
  // ваш код
}
`,
    solution: `function flatten(array, depth = 1) {
  const result = [];
  for (const item of array) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}
`,
    tests: [
      { name: 'глубина по умолчанию 1', code: `expect(flatten([1, [2, [3, [4]]]])).toEqual([1, 2, [3, [4]]]);` },
      { name: 'произвольная глубина', code: `expect(flatten([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);` },
      { name: 'Infinity — полностью', code: `expect(flatten([[[[1]]], 2], Infinity)).toEqual([1, 2]);` },
      { name: 'не использует Array.prototype.flat', code: `const original = Array.prototype.flat;
Array.prototype.flat = function () { throw new Error('flat запрещён'); };
try {
  expect(flatten([1, [2]])).toEqual([1, 2]);
} finally {
  Array.prototype.flat = original;
}` },
    ],
    hints: ['Рекурсия с уменьшением depth на каждом уровне.'],
  },
  {
    id: 'js-get-path',
    trackId: 'javascript',
    title: 'Безопасный доступ по пути',
    level: 'basic',
    language: 'javascript',
    relatedLessonId: 'modern-features',
    description: `Напишите \`get(object, path, defaultValue)\`. Путь — строка вида \`'user.addresses[0].city'\`.

- Если на каком-то шаге значение \`null\` или \`undefined\` — вернуть \`defaultValue\`.
- Если итоговое значение \`undefined\` — вернуть \`defaultValue\`.`,
    starter: `function get(object, path, defaultValue) {
  // ваш код
}
`,
    solution: `function get(object, path, defaultValue) {
  const keys = path.replace(/\\[(\\w+)\\]/g, '.$1').split('.').filter(Boolean);
  let current = object;
  for (const key of keys) {
    if (current == null) return defaultValue;
    current = current[key];
  }
  return current === undefined ? defaultValue : current;
}
`,
    tests: [
      { name: 'точки и индексы', code: `const data = { user: { addresses: [{ city: 'Казань' }] } };
expect(get(data, 'user.addresses[0].city')).toBe('Казань');` },
      { name: 'значение по умолчанию', code: `expect(get({ a: null }, 'a.b.c', 'нет')).toBe('нет');
expect(get({}, 'x', 0)).toBe(0);` },
      { name: 'falsy-значения не заменяются', code: `expect(get({ a: { b: 0 } }, 'a.b', 5)).toBe(0);
expect(get({ a: '' }, 'a', 'x')).toBe('');` },
    ],
    hints: ['Превратите [0] в .0 регулярным выражением, затем split(\'.\').', 'Проверяйте current == null на каждом шаге.'],
  },
  {
    id: 'js-retry',
    trackId: 'javascript',
    title: 'Повтор асинхронной операции',
    level: 'middle',
    language: 'javascript',
    relatedLessonId: 'promises',
    description: `Напишите \`retry(fn, { attempts, delayMs })\`:

- вызывает асинхронную \`fn()\`;
- при ошибке ждёт \`delayMs\` и пробует снова, всего не более \`attempts\` попыток;
- возвращает первый успешный результат или отклоняется **последней** ошибкой.`,
    starter: `async function retry(fn, { attempts, delayMs }) {
  // ваш код
}
`,
    solution: `async function retry(fn, { attempts, delayMs }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
`,
    tests: [
      { name: 'возвращает результат после неудачных попыток', code: `let calls = 0;
const flaky = async () => {
  calls += 1;
  if (calls < 3) throw new Error('сбой ' + calls);
  return 'ok';
};
expect(await retry(flaky, { attempts: 5, delayMs: 5 })).toBe('ok');
expect(calls).toBe(3);` },
      { name: 'отклоняется последней ошибкой', code: `let calls = 0;
let message = '';
try {
  await retry(async () => { calls += 1; throw new Error('попытка ' + calls); }, { attempts: 3, delayMs: 1 });
} catch (e) {
  message = e.message;
}
expect(message).toBe('попытка 3');
expect(calls).toBe(3);` },
      { name: 'ждёт между попытками', code: `let calls = 0;
const started = Date.now();
await retry(async () => { calls += 1; if (calls < 3) throw new Error('x'); return 1; }, { attempts: 3, delayMs: 30 });
expect(Date.now() - started).toBeGreaterThan(50);` },
    ],
    hints: ['Цикл for с try/catch и await внутри.', 'Задержка — await new Promise((r) => setTimeout(r, ms)).'],
  },
  {
    id: 'js-promise-pool',
    trackId: 'javascript',
    title: 'Ограничение параллельности',
    level: 'advanced',
    language: 'javascript',
    relatedLessonId: 'promises',
    description: `Напишите \`runWithLimit(tasks, limit)\`. \`tasks\` — массив функций, возвращающих промисы.

- Одновременно выполняется не больше \`limit\` задач.
- Как только задача завершилась, запускается следующая.
- Результат — массив значений в **исходном порядке** задач.`,
    starter: `async function runWithLimit(tasks, limit) {
  // ваш код
}
`,
    solution: `async function runWithLimit(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
`,
    tests: [
      { name: 'сохраняет порядок', code: `const tasks = [30, 5, 15].map((ms, i) => () => new Promise((r) => setTimeout(() => r(i), ms)));
expect(await runWithLimit(tasks, 2)).toEqual([0, 1, 2]);` },
      { name: 'не превышает лимит', code: `let active = 0;
let maxActive = 0;
const task = () => new Promise((resolve) => {
  active += 1;
  maxActive = Math.max(maxActive, active);
  setTimeout(() => { active -= 1; resolve(true); }, 10);
});
await runWithLimit(Array.from({ length: 7 }, () => task), 3);
expect(maxActive).toBe(3);` },
      { name: 'пустой список', code: `expect(await runWithLimit([], 3)).toEqual([]);` },
    ],
    hints: ['Запустите limit «воркеров», каждый берёт следующую задачу из общего счётчика.', 'Индекс задачи нужно запомнить до await, чтобы записать результат в правильную позицию.'],
  },
  {
    id: 'js-range-iterator',
    trackId: 'javascript',
    title: 'Итерируемый диапазон',
    level: 'basic',
    language: 'javascript',
    relatedLessonId: 'generators-iterators',
    description: `Создайте класс \`Range(from, to, step = 1)\`, объекты которого можно перебирать через \`for...of\` и spread.

~~~js
[...new Range(1, 5)]; // [1, 2, 3, 4, 5]
[...new Range(0, 10, 5)]; // [0, 5, 10]
~~~

Перебор можно запускать несколько раз.`,
    starter: `class Range {
  constructor(from, to, step = 1) {
    // ваш код
  }
}
`,
    solution: `class Range {
  constructor(from, to, step = 1) {
    this.from = from;
    this.to = to;
    this.step = step;
  }

  *[Symbol.iterator]() {
    for (let value = this.from; value <= this.to; value += this.step) {
      yield value;
    }
  }
}
`,
    tests: [
      { name: 'spread', code: `expect([...new Range(1, 5)]).toEqual([1, 2, 3, 4, 5]);` },
      { name: 'шаг', code: `expect([...new Range(0, 10, 5)]).toEqual([0, 5, 10]);` },
      { name: 'повторный перебор', code: `const range = new Range(1, 3);
expect([...range]).toEqual([1, 2, 3]);
expect([...range]).toEqual([1, 2, 3]);` },
      { name: 'for...of', code: `let sum = 0;
for (const n of new Range(1, 4)) sum += n;
expect(sum).toBe(10);` },
    ],
    hints: ['Определите метод *[Symbol.iterator]() — генератор.'],
  },
] as const satisfies readonly Exercise[];
