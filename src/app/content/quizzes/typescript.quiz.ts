import type { Quiz } from '../../domain/quiz.model';

export const TYPESCRIPT_QUIZ = {
  trackId: 'typescript',
  questions: [
    {
      id: 'unknown-vs-any',
      prompt: 'Чем unknown отличается от any?',
      options: [
        'Ничем, это синонимы',
        'С unknown нельзя ничего сделать без сужения типа, any отключает проверки',
        'unknown нельзя присвоить значение',
        'any безопаснее, потому что поддерживает автодополнение',
      ],
      correctIndex: 1,
      explanation:
        'Оба принимают любое значение. Но `any` выключает проверку типов везде, где встречается, а `unknown` запрещает операции, пока вы не сузите тип через `typeof`, `instanceof`, `in` или type guard. Для внешних данных — `unknown`.',
    },
    {
      id: 'type-vs-interface',
      prompt: 'Что можно выразить только через type, но не через interface?',
      options: ['Объект с методами', 'Объединение типов (union)', 'Необязательные поля', 'Наследование через extends'],
      correctIndex: 1,
      explanation:
        '`type` — псевдоним для любого типа: объединений, кортежей, функций, mapped и условных типов. Интерфейс описывает только объекты, зато поддерживает слияние объявлений.',
    },
    {
      id: 'satisfies',
      prompt: 'Что делает оператор satisfies?',
      code: `~~~ts
const theme = { primary: '#2450b8' } satisfies Record<string, string>;
~~~`,
      options: [
        'Приводит тип как as, без проверки',
        'Проверяет совместимость значения с типом, сохраняя выведенный (узкий) тип',
        'Делает объект readonly',
        'Создаёт branded type',
      ],
      correctIndex: 1,
      explanation:
        'Аннотация `const x: T` расширяет тип переменной до `T`, `as` не проверяет совместимость, а `satisfies` проверяет и оставляет точный выведенный тип — например, литералы.',
    },
    {
      id: 'distributive',
      prompt: 'Чему равен тип R?',
      code: `~~~ts
type ToArray<T> = T extends unknown ? T[] : never;
type R = ToArray<string | number>;
~~~`,
      options: ['(string | number)[]', 'string[] | number[]', 'never', 'unknown[]'],
      correctIndex: 1,
      explanation:
        'Условный тип над «голым» параметром дистрибутивен: применяется к каждому члену объединения по отдельности. Чтобы получить `(string | number)[]`, оберните в кортеж: `[T] extends [unknown]`.',
    },
    {
      id: 'never-exhaustive',
      prompt: 'Зачем в default-ветке switch вызывают функцию assertNever(value: never)?',
      options: [
        'Чтобы ускорить выполнение',
        'Чтобы компилятор сообщил об ошибке, если в union добавят вариант и забудут его обработать',
        'Чтобы switch работал со строками',
        'Это требование линтера без практического смысла',
      ],
      correctIndex: 1,
      explanation:
        'Если все варианты обработаны, в default значение имеет тип `never`. Новый необработанный вариант делает тип не-never, и передача в `assertNever` становится ошибкой компиляции во всех таких местах.',
    },
    {
      id: 'infer',
      prompt: 'Что вернёт тип Unpack<Promise<User[]>>?',
      code: `~~~ts
type Unpack<T> = T extends Promise<infer V> ? V : T;
~~~`,
      options: ['Promise<User[]>', 'User', 'User[]', 'unknown'],
      correctIndex: 2,
      explanation: '`infer V` выводит тип значения промиса — `User[]`. Встроенный `Awaited` работает так же, но рекурсивно.',
    },
    {
      id: 'enum-runtime',
      prompt: 'Почему во многих проектах вместо enum используют union литералов и объект as const?',
      options: [
        'enum не поддерживается в Angular',
        'enum генерирует код в рантайме, строковые enum не принимают обычные строки, хуже tree-shaking',
        'union работает быстрее в рантайме',
        'enum запрещён в strict-режиме',
      ],
      correctIndex: 1,
      explanation:
        'Union-литералы стираются при компиляции, совместимы со строками из JSON и шаблонов и подходят для режима «только стираемый синтаксис». Нужен список значений — объект/массив `as const` и выведенный из него тип.',
    },
    {
      id: 'no-unchecked-index',
      prompt: 'Что меняет флаг noUncheckedIndexedAccess?',
      options: [
        'Запрещает доступ к массивам по индексу',
        'Тип arr[i] и obj[key] становится T | undefined',
        'Отключает проверку выхода за границы',
        'Делает все массивы readonly',
      ],
      correctIndex: 1,
      explanation:
        'Без флага `users[0]` имеет тип `User`, хотя массив может быть пустым. С флагом — `User | undefined`, и компилятор заставляет обработать отсутствие значения.',
    },
    {
      id: 'branded',
      prompt: 'Какую проблему решают branded types?',
      options: [
        'Ускоряют сравнение строк',
        'Не позволяют перепутать значения одного примитивного типа с разным смыслом (UserId и OrderId)',
        'Добавляют валидацию в рантайме автоматически',
        'Заменяют классы',
      ],
      correctIndex: 1,
      explanation:
        'Структурная типизация считает все `string` одинаковыми. Фантомное поле `& { __brand: \'OrderId\' }` делает типы несовместимыми, а «умный конструктор» с проверкой — единственное место создания значения.',
    },
    {
      id: 'decorators-angular',
      prompt: 'Нужен ли reflect-metadata для работы декораторов Angular?',
      options: [
        'Да, без него не работает DI',
        'Нет: AOT-компилятор превращает декораторы в статические определения (ɵcmp, ɵfac)',
        'Только для @Injectable',
        'Только в режиме разработки',
      ],
      correctIndex: 1,
      explanation:
        'Компилятор Angular читает метаданные декораторов и типы параметров из исходников при сборке и генерирует статические поля. В рантайме декораторы фактически не выполняются.',
    },
    {
      id: 'private-vs-hash',
      prompt: 'Чем private из TypeScript отличается от поля #private?',
      options: [
        'Ничем, #private — просто сокращённая запись',
        'private проверяет только компилятор, а #private скрывает поле в рантайме: его нет в JSON.stringify и Object.keys',
        '#private работает только в Angular',
        'private доступен наследникам, а #private — нет',
      ],
      correctIndex: 1,
      explanation:
        'После компиляции `private` стирается, и поле становится обычным свойством: его видно в `JSON.stringify` и можно прочитать через `obj[\'field\']`. `#field` — стандарт ECMAScript, приватность обеспечивает движок. Ни то ни другое наследникам не доступно. Подробнее — [Классы](/tracks/typescript/classes).',
    },
    {
      id: 'private-other-instance',
      prompt: 'Скомпилируется ли метод equals?',
      code: `~~~ts
class Point {
  constructor(private x: number) {}
  equals(other: Point) {
    return this.x === other.x;
  }
}
~~~`,
      options: [
        'Нет: к private-полю другого экземпляра обращаться нельзя',
        'Да: private ограничивает доступ на уровне класса, а не экземпляра',
        'Только с флагом strict: false',
        'Только если x объявить как readonly',
      ],
      correctIndex: 1,
      explanation:
        'Приватность в TypeScript (как и в Java или C#) действует на уровне класса: внутри `Point` доступны private-члены любого экземпляра `Point`.',
    },
    {
      id: 'protected-access',
      prompt: 'Где доступен protected-член класса?',
      options: [
        'Только внутри самого класса',
        'Внутри класса и его наследников, но не снаружи',
        'Везде, кроме других модулей',
        'Только в статических методах',
      ],
      correctIndex: 1,
      explanation:
        '`protected` — для класса и наследников. В Angular так помечают члены компонента, которые нужны только шаблону: шаблон их видит, внешний код нет.',
    },
    {
      id: 'static-instance',
      prompt: 'Что выведет код?',
      code: `~~~ts
class Counter {
  static total = 0;
  constructor() {
    Counter.total++;
  }
}
const c = new Counter();
new Counter();
console.log(Counter.total, (c as any).total);
~~~`,
      options: ['2 2', '2 undefined', '1 1', '0 undefined'],
      correctIndex: 1,
      explanation:
        'static-поле принадлежит конструктору `Counter`, а не экземплярам. Через `c` его не видно, поэтому `c.total` — `undefined`.',
    },
    {
      id: 'abstract-runtime',
      prompt: 'Что произойдёт, если создать экземпляр абстрактного класса из обычного JavaScript-кода?',
      options: [
        'Движок бросит TypeError',
        'Экземпляр создастся: abstract существует только на этапе компиляции',
        'Вернётся undefined',
        'Создастся экземпляр первого наследника',
      ],
      correctIndex: 1,
      explanation:
        'После компиляции абстрактный класс — обычный класс. Если нужна защита в рантайме, проверяйте `new.target` в конструкторе.',
    },
    {
      id: 'private-constructor',
      prompt: 'Зачем объявлять конструктор как private?',
      options: [
        'Чтобы класс нельзя было наследовать и создать через new снаружи — экземпляры создаются только через static-методы (singleton, фабрика)',
        'Чтобы ускорить создание объектов',
        'Чтобы поля стали приватными автоматически',
        'Это запрещено в TypeScript',
      ],
      correctIndex: 0,
      explanation:
        'С `private constructor` вызвать `new` можно только внутри класса, например в `static get instance()`. `protected constructor` запрещает прямое создание, но разрешает наследование.',
    },
    {
      id: 'override-keyword',
      prompt: 'Какую ошибку помогает поймать модификатор override вместе с noImplicitOverride?',
      options: [
        'Вызов метода до конструктора',
        'Ситуацию, когда метод в родителе переименовали или удалили, а наследник молча объявил новый метод',
        'Утечку памяти в подписках',
        'Неправильный тип возвращаемого значения в интерфейсе',
      ],
      correctIndex: 1,
      explanation:
        'С `override` компилятор проверяет, что в базовом классе есть такой член. `noImplicitOverride` делает слово обязательным, поэтому случайное переопределение тоже становится видно.',
    },
  ],
} as const satisfies Quiz;
