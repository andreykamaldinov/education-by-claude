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
  ],
} as const satisfies Quiz;
