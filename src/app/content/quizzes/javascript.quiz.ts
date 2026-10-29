import type { Quiz } from '../../domain/quiz.model';

export const JAVASCRIPT_QUIZ = {
  trackId: 'javascript',
  questions: [
    {
      id: 'event-loop-order',
      prompt: 'В каком порядке выведутся строки?',
      code: `~~~js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
~~~`,
      options: ['1, 2, 3, 4', '1, 4, 3, 2', '1, 4, 2, 3', '1, 3, 4, 2'],
      correctIndex: 1,
      explanation:
        'Синхронный код выполняется первым (1, 4). После него очередь **микрозадач** опустошается полностью (then → 3), и только затем браузер берёт следующую **макрозадачу** — колбэк таймера (2). Подробнее — [Event Loop](/tracks/javascript/event-loop).',
    },
    {
      id: 'var-loop',
      prompt: 'Что выведет код?',
      code: `~~~js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
~~~`,
      options: ['0, 1, 2', '3, 3, 3', 'undefined ×3', 'ReferenceError'],
      correctIndex: 1,
      explanation:
        '`var` создаёт одну переменную на всю функцию. Все три колбэка замыкают её, а к моменту срабатывания таймеров цикл завершён и `i === 3`. С `let` каждая итерация получила бы свою привязку и вывела бы 0, 1, 2.',
    },
    {
      id: 'tdz',
      prompt: 'Что произойдёт при выполнении?',
      code: `~~~js
let x = 'внешняя';
{
  console.log(x);
  let x = 'внутренняя';
}
~~~`,
      options: ['Выведет «внешняя»', 'Выведет undefined', 'ReferenceError', 'Выведет «внутренняя»'],
      correctIndex: 2,
      explanation:
        'Внутренняя `x` поднимается в начало блока и затеняет внешнюю, но до строки объявления находится во **временной мёртвой зоне**. Обращение к ней бросает `ReferenceError: Cannot access \'x\' before initialization`.',
    },
    {
      id: 'this-arrow',
      prompt: 'Что вернёт obj.getArrow()?',
      code: `~~~js
const obj = {
  name: 'obj',
  getArrow: () => this?.name,
  getRegular() { return this.name; },
};
~~~`,
      options: ["'obj'", 'undefined (this модуля)', 'TypeError', "''"],
      correctIndex: 1,
      explanation:
        'Стрелочная функция не имеет собственного `this` и берёт его из окружающей лексической области — здесь это верхний уровень модуля, где `this === undefined`. Метод `getRegular` вернул бы `obj`.',
    },
    {
      id: 'equality',
      prompt: 'Какое из выражений вернёт true?',
      options: ['NaN === NaN', 'null == 0', "[] == false", "'0' === 0"],
      correctIndex: 2,
      explanation:
        'При `==` false приводится к 0, массив — к примитиву: `[]` → `\'\'` → 0, поэтому `[] == false` истинно. `NaN` не равен ничему, включая себя; `null` нестрого равен только `undefined`; `===` не приводит типы.',
    },
    {
      id: 'promise-executor',
      prompt: 'Что выведется первым?',
      code: `~~~js
new Promise((resolve) => {
  console.log('A');
  resolve();
}).then(() => console.log('B'));
console.log('C');
~~~`,
      options: ['C', 'B', 'A', 'Порядок не определён'],
      correctIndex: 2,
      explanation: 'Функция-executor, переданная в `new Promise`, выполняется **синхронно**. Порядок: A, C, B — then идёт через очередь микрозадач.',
    },
    {
      id: 'closure-memory',
      prompt: 'Что такое замыкание?',
      options: [
        'Функция, которая вызывает сама себя',
        'Функция вместе со ссылкой на лексическое окружение, в котором она создана',
        'Способ закрыть доступ к объекту через Object.freeze',
        'Функция, объявленная внутри класса',
      ],
      correctIndex: 1,
      explanation:
        'Функция хранит ссылку `[[Environment]]` на окружение создания и видит его переменные даже после выхода из внешней функции. Замыкается **переменная**, а не её значение. Подробнее — [Замыкания](/tracks/javascript/closures).',
    },
    {
      id: 'prototype-vs-proto',
      prompt: 'Чем отличается Fn.prototype от obj.__proto__?',
      options: [
        'Это одно и то же',
        'prototype есть у функций и становится [[Prototype]] объектов, созданных через new; __proto__ — прототип конкретного объекта',
        '__proto__ есть только у классов',
        'prototype — устаревшее свойство, его заменил __proto__',
      ],
      correctIndex: 1,
      explanation:
        'После `const u = new User()` верно `Object.getPrototypeOf(u) === User.prototype`. Современный API для работы с прототипом — `Object.getPrototypeOf` / `Object.create`.',
    },
    {
      id: 'promise-all-settled',
      prompt: 'Нужно отправить пять независимых запросов и показать результат каждого, даже если часть упала. Что использовать?',
      options: ['Promise.all', 'Promise.race', 'Promise.allSettled', 'Promise.any'],
      correctIndex: 2,
      explanation:
        '`allSettled` дожидается всех промисов и возвращает статус каждого (`fulfilled` с value или `rejected` с reason). `all` отклоняется при первой ошибке, `race` — первый осевший, `any` — первый успешный.',
    },
    {
      id: 'microtask-starvation',
      prompt: 'Почему рекурсивное Promise.resolve().then(loop) подвешивает страницу, а рекурсивный setTimeout(loop) — нет?',
      options: [
        'Промисы выполняются в отдельном потоке',
        'Очередь микрозадач опустошается полностью перед рендером, и новые микрозадачи добавляются бесконечно',
        'setTimeout автоматически ограничен 60 вызовами в секунду',
        'Промисы блокируют сборщик мусора',
      ],
      correctIndex: 1,
      explanation:
        'Event loop не перейдёт к рендерингу и обработке ввода, пока очередь микрозадач не пуста. Между макрозадачами (таймерами) браузер успевает рисовать кадры и обрабатывать события.',
    },
    {
      id: 'weakmap',
      prompt: 'Когда стоит использовать WeakMap вместо Map?',
      options: [
        'Когда ключи — строки',
        'Когда нужно перебирать записи по порядку',
        'Когда нужно хранить данные об объекте, не продлевая его жизнь',
        'Когда нужна максимальная скорость',
      ],
      correctIndex: 2,
      explanation:
        'WeakMap держит ключи-объекты слабо: когда на объект не остаётся других ссылок, запись удаляется вместе с ним. Ключи — только объекты, коллекцию нельзя перебрать и узнать её размер.',
    },
    {
      id: 'esm-live-binding',
      prompt: 'Модуль counter.js экспортирует let count = 0 и функцию increment(). Что увидит импортирующий модуль после вызова increment()?',
      options: [
        'Всегда 0 — импорт копирует значение',
        'Актуальное значение 1 — ESM-импорт это живая привязка',
        'Ошибку: импорт нельзя читать после изменения',
        'Зависит от сборщика',
      ],
      correctIndex: 1,
      explanation:
        'В ES-модулях импорт — ссылка на переменную экспортирующего модуля (live binding). В CommonJS деструктурированный `require` даёт копию на момент импорта.',
    },
  ],
} as const satisfies Quiz;
