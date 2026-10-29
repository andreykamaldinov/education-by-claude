import type { Quiz } from '../../domain/quiz.model';

export const ANGULAR_QUIZ = {
  trackId: 'angular',
  questions: [
    {
      id: 'cd-how',
      prompt: 'Что делает Angular во время change detection?',
      options: [
        'Перерисовывает весь DOM приложения',
        'Обходит дерево view и сравнивает текущие значения биндингов с предыдущими, обновляя DOM при отличиях',
        'Подписывается на каждое поле класса через Proxy',
        'Сравнивает виртуальный DOM с реальным',
      ],
      correctIndex: 1,
      explanation:
        'Angular хранит предыдущие значения биндингов в LView и при проверке вычисляет выражения заново, обновляя только изменившиеся места. Виртуального DOM в Angular нет. Подробнее — [Как работает Change Detection](/tracks/angular/change-detection).',
    },
    {
      id: 'onpush-default',
      prompt: 'Какая стратегия change detection используется по умолчанию в Angular 22?',
      options: ['Default', 'OnPush', 'Eager', 'Zoneless'],
      correctIndex: 1,
      explanation:
        'С Angular 22 компоненты без явной стратегии ведут себя как `OnPush`. Старая стратегия «проверять всегда» называется `Eager`, имя `Default` объявлено устаревшим. Zoneless — это способ планирования проверок, а не стратегия компонента.',
    },
    {
      id: 'onpush-triggers',
      prompt: 'Что из перечисленного НЕ приведёт к проверке OnPush-компонента?',
      options: [
        'Новая ссылка в input от родителя',
        'Клик по кнопке в шаблоне компонента',
        'Изменение сигнала, прочитанного в шаблоне',
        'Присваивание нового значения обычному полю в setTimeout',
      ],
      correctIndex: 3,
      explanation:
        'OnPush-компонент проверяется при новом input, событии из его шаблона, изменении сигнала из шаблона или явном `markForCheck()`. Присваивание поля в таймере Angular не видит — используйте сигнал.',
    },
    {
      id: 'zone-js-role',
      prompt: 'Какую роль играл zone.js в Angular?',
      options: [
        'Изолировал стили компонентов',
        'Патчил асинхронные API и сообщал Angular, когда запускать change detection',
        'Отвечал за ленивую загрузку модулей',
        'Реализовывал DI',
      ],
      correctIndex: 1,
      explanation:
        'zone.js перехватывает таймеры, промисы, события и XHR. Angular запускал `ApplicationRef.tick()` после каждой асинхронной задачи в NgZone. С Angular 21 новые приложения zoneless по умолчанию.',
    },
    {
      id: 'zoneless-notify',
      prompt: 'Как Angular узнаёт об изменениях в zoneless-режиме?',
      options: [
        'Опрашивает компоненты каждые 16 мс',
        'Через изменения сигналов из шаблона, markForCheck, события шаблона, setInput и операции с view',
        'Через MutationObserver на document',
        'Никак — нужно вручную вызывать detectChanges',
      ],
      correctIndex: 1,
      explanation:
        'Планировщик получает явные уведомления и объединяет их в один `tick()`. Поэтому код, который меняет обычные поля в колбэках, при переходе на zoneless переводят на сигналы.',
    },
    {
      id: 'expression-changed',
      prompt: 'Когда возникает ExpressionChangedAfterItHasBeenCheckedError?',
      options: [
        'Когда input помечен как required, а значение не передано',
        'Когда в dev-режиме проверочный проход видит, что значение биндинга изменилось после проверки',
        'Когда сигнал записывается внутри computed',
        'При любой ошибке в шаблоне',
      ],
      correctIndex: 1,
      explanation:
        'В режиме разработки Angular делает второй проход и сверяет значения. Изменение после проверки — симптом нарушения однонаправленного потока данных (например, ребёнок меняет состояние родителя в ngAfterViewInit).',
    },
    {
      id: 'computed-vs-effect',
      prompt: 'Нужно вычислить полное имя из firstName и lastName. Что использовать?',
      options: ['effect, который пишет в signal fullName', 'computed', 'ngOnChanges', 'BehaviorSubject'],
      correctIndex: 1,
      explanation:
        'Производное значение — это `computed`: ленивое, мемоизированное, без побочных эффектов. `effect` для синхронизации сигналов между собой — антипаттерн; он нужен для внешнего мира (DOM вне Angular, storage, логи).',
    },
    {
      id: 'linked-signal',
      prompt: 'Для чего нужен linkedSignal?',
      options: [
        'Для двусторонней привязки к родителю',
        'Для записываемого состояния, которое пересчитывается при смене источника, но может меняться вручную',
        'Для связи сигнала с Observable',
        'Для передачи сигнала между вкладками',
      ],
      correctIndex: 1,
      explanation:
        'Пример — выбранный элемент списка: при смене списка он сбрасывается на значение по умолчанию, а пользователь может выбрать другой через `set`.',
    },
    {
      id: 'di-resolution',
      prompt: 'Компонент внедряет CartService. В каком порядке Angular ищет провайдер?',
      options: [
        'Сначала корневой инжектор, потом компонент',
        'Элементные инжекторы от компонента вверх по дереву, затем инжекторы окружения (маршрут, root, platform)',
        'Только в providers компонента',
        'В порядке импортов в main.ts',
      ],
      correctIndex: 1,
      explanation:
        'Если нигде не найдено — `NullInjectorError` (или `null` с `optional: true`). Модификаторы `self`, `skipSelf`, `host` ограничивают путь поиска.',
    },
    {
      id: 'service-per-component',
      prompt: 'Как получить отдельный экземпляр сервиса для каждого экземпляра компонента?',
      options: [
        'providedIn: "any"',
        'Указать сервис в providers компонента',
        'Вызывать new Service() в конструкторе',
        'Использовать static поле',
      ],
      correctIndex: 1,
      explanation:
        'Элементный инжектор компонента создаст свой экземпляр, доступный компоненту и его потомкам, и уничтожит его вместе с компонентом (сработает ngOnDestroy сервиса).',
    },
    {
      id: 'can-match',
      prompt: 'Чем canMatch отличается от canActivate?',
      options: [
        'Ничем',
        'canMatch участвует в сопоставлении: при false роутер ищет другие маршруты, а ленивый код не загружается',
        'canMatch работает только с параметрами',
        'canActivate вызывается раньше',
      ],
      correctIndex: 1,
      explanation:
        '`canActivate` вызывается после выбора маршрута и при false отменяет навигацию. `canMatch` удобен для ролевого доступа к ленивым разделам и альтернативных маршрутов на один путь.',
    },
    {
      id: 'for-track',
      prompt: 'Почему track item (по ссылке объекта) в @for плох для данных с сервера?',
      code: `~~~html
@for (item of items(); track item) { <app-row [item]="item" /> }
~~~`,
      options: [
        'Это синтаксическая ошибка',
        'Каждый ответ сервера — новые объекты, Angular пересоздаст весь DOM списка',
        'track по объекту работает медленнее на 1%',
        'Нельзя использовать объекты в шаблоне',
      ],
      correctIndex: 1,
      explanation: 'По `track` Angular сопоставляет элементы между обновлениями. Используйте стабильный идентификатор: `track item.id`.',
    },
    {
      id: 'pure-pipe',
      prompt: 'Чистый пайп не пересчитался после items.push(newItem). Почему?',
      options: [
        'Пайпы вызываются только при инициализации',
        'Чистый пайп пересчитывается при смене ссылки входа, а push не меняет ссылку массива',
        'Нужно добавить pure: true',
        'Пайпы не работают с массивами',
      ],
      correctIndex: 1,
      explanation:
        'Решение — иммутабельное обновление (`[...items, newItem]`), а не превращение пайпа в нечистый: нечистый вызывается на каждой проверке.',
    },
    {
      id: 'constructor-vs-oninit',
      prompt: 'Где читать значение required input?',
      options: [
        'В конструкторе',
        'В ngOnInit или реактивно через computed/resource',
        'В инициализаторе поля',
        'Только в ngAfterViewInit',
      ],
      correctIndex: 1,
      explanation:
        'В конструкторе inputs ещё не установлены — чтение required signal input бросит ошибку. Конструктор и поля — для DI и создания сигналов.',
    },
    {
      id: 'defer',
      prompt: 'Что делает блок @defer (on viewport)?',
      options: [
        'Откладывает change detection блока',
        'Выносит компоненты блока в отдельный чанк и загружает их, когда placeholder попадает в область видимости',
        'Рендерит блок только на сервере',
        'Кеширует блок в localStorage',
      ],
      correctIndex: 1,
      explanation:
        'Зависимости внутри `@defer` (standalone и не используемые вне блока) попадают в отдельный чанк. С `hydrate on ...` блок рендерится на сервере, а гидрируется по триггеру.',
    },
    {
      id: 'build-esbuild',
      prompt: 'Почему Angular CLI перешёл с Webpack на esbuild и Vite?',
      options: [
        'Webpack перестал поддерживаться',
        'Ради многократного ускорения сборки и dev-сервера, единого builder для SSR и меньшего числа зависимостей',
        'Чтобы поддержать React',
        'Из-за лицензии Webpack',
      ],
      correctIndex: 1,
      explanation:
        'esbuild написан на Go и параллелится, Vite даёт быстрый dev-сервер и HMR. Цена — нельзя расширять сборку Webpack-конфигом. Подробнее — [Почему Angular перешёл на esbuild и Vite](/tracks/tooling/angular-builders).',
    },
  ],
} as const satisfies Quiz;
