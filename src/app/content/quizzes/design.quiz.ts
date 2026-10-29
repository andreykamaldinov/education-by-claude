import type { Quiz } from '../../domain/quiz.model';

export const OOP_SOLID_QUIZ = {
  trackId: 'oop-solid',
  questions: [
    {
      id: 'srp',
      prompt: 'Как точнее всего сформулировать Single Responsibility Principle?',
      options: [
        'У класса должен быть один метод',
        'У модуля должна быть одна причина для изменения',
        'Класс не должен иметь зависимостей',
        'Файл не должен быть длиннее 100 строк',
      ],
      correctIndex: 1,
      explanation: 'Модуль отвечает перед одним «актором» — группой людей, которая может потребовать изменений.',
    },
    {
      id: 'ocp-angular',
      prompt: 'Какой механизм Angular лучше всего иллюстрирует Open/Closed Principle?',
      options: ['ngOnInit', 'multi-провайдеры (интерсепторы, валидаторы)', 'ViewEncapsulation', '@if'],
      correctIndex: 1,
      explanation: 'Новое поведение добавляется новым провайдером, а код, использующий токен, не меняется.',
    },
    {
      id: 'lsp',
      prompt: 'Что является признаком нарушения LSP?',
      options: [
        'Наследник добавляет новый метод',
        'Наследник переопределяет метод и бросает «not supported», а клиенты проверяют instanceof',
        'Класс реализует несколько интерфейсов',
        'Использование абстрактного класса',
      ],
      correctIndex: 1,
      explanation: 'Подтип должен заменять базовый тип без сюрпризов. Классический пример — изменяемый `Square extends Rectangle`.',
    },
    {
      id: 'isp',
      prompt: 'Компонент выпадающего списка зависит от репозитория с методами чтения, записи и экспорта, но использует только getAll. Какой принцип нарушен?',
      options: ['DIP', 'ISP', 'OCP', 'DRY'],
      correctIndex: 1,
      explanation: 'Interface Segregation: клиенты не должны зависеть от методов, которые не используют. Выделите `Readable<T>`.',
    },
    {
      id: 'dip-vs-di',
      prompt: 'Чем Dependency Inversion отличается от Dependency Injection?',
      options: [
        'Это одно и то же',
        'DIP — принцип (зависеть от абстракций, которыми владеет верхний уровень), DI — техника передачи зависимостей извне',
        'DI — принцип, DIP — библиотека',
        'DIP применяется только на бэкенде',
      ],
      correctIndex: 1,
      explanation: 'DI-контейнер Angular помогает реализовать DIP: компонент внедряет абстрактный токен, конфигурация подставляет реализацию.',
    },
    {
      id: 'composition',
      prompt: 'Почему рекомендуют композицию вместо наследования?',
      options: [
        'Наследование не поддерживается в TypeScript',
        'Наследование создаёт жёсткую связь и взрыв иерархий; композиция собирает поведение из независимых частей',
        'Композиция быстрее в рантайме',
        'Так требует Angular',
      ],
      correctIndex: 1,
      explanation: 'В Angular: сервисы в providers, hostDirectives, функции с inject() вместо базовых компонентов.',
    },
    {
      id: 'private-hash',
      prompt: 'Чем #field отличается от private field в TypeScript?',
      options: [
        'Ничем',
        '#field — настоящая приватность движка, private — только проверка компилятора',
        'private быстрее',
        '#field доступен в шаблоне Angular',
      ],
      correctIndex: 1,
      explanation: '`private` стирается при компиляции и обходится через `obj[\'field\']`. Ни то ни другое не доступно в шаблоне — для шаблона используйте `protected`.',
    },
    {
      id: 'dry',
      prompt: 'Две функции содержат одинаковое условие age >= 18: проверка совершеннолетия и разрешение продажи алкоголя. Стоит ли их объединить?',
      options: [
        'Обязательно — это нарушение DRY',
        'Не обязательно: код совпадает, но знания разные и меняются по разным причинам',
        'Нужно вынести 18 в глобальную константу MAGIC',
        'Нужно наследование',
      ],
      correctIndex: 1,
      explanation: 'DRY — про дублирование знания, а не текста. Неправильная абстракция дороже дублирования.',
    },
  ],
} as const satisfies Quiz;

export const PATTERNS_QUIZ = {
  trackId: 'patterns',
  questions: [
    {
      id: 'interceptors',
      prompt: 'Какой паттерн лежит в основе HTTP-интерсепторов Angular?',
      options: ['Singleton', 'Chain of Responsibility (и Decorator)', 'Builder', 'Iterator'],
      correctIndex: 1,
      explanation: 'Каждый интерсептор получает запрос и `next`, может изменить запрос, обработать ответ или ответить сам.',
    },
    {
      id: 'singleton-di',
      prompt: 'Как в Angular правильно получить единственный экземпляр сервиса на приложение?',
      options: ['static getInstance()', "providedIn: 'root'", 'Глобальная переменная window.service', 'Object.freeze'],
      correctIndex: 1,
      explanation: 'Единственность обеспечивает DI-конфигурация; зависимость явная и подменяемая в тестах.',
    },
    {
      id: 'facade',
      prompt: 'Зачем фасад над NgRx Store?',
      options: [
        'Чтобы ускорить селекторы',
        'Чтобы компоненты зависели от простого API фичи, а не от actions и selectors',
        'Чтобы отключить DevTools',
        'Это обязательное требование NgRx',
      ],
      correctIndex: 1,
      explanation: 'Фасад упрощает компоненты и тесты и позволяет сменить технологию стора без переписывания UI.',
    },
    {
      id: 'strategy-angular',
      prompt: 'Что из перечисленного — пример паттерна Strategy в Angular?',
      options: ['@Component', 'PreloadingStrategy / RouteReuseStrategy', 'ngOnDestroy', 'Renderer2'],
      correctIndex: 1,
      explanation: 'Взаимозаменяемые алгоритмы за общим интерфейсом, выбираемые конфигурацией.',
    },
    {
      id: 'composite-forms',
      prompt: 'Где в Angular используется Composite?',
      options: ['FormGroup / FormArray / FormControl', 'HttpClient', 'Router events', 'DomSanitizer'],
      correctIndex: 0,
      explanation: 'Все контролы — `AbstractControl`; `valid`, `value`, `reset` работают одинаково для поля и группы.',
    },
    {
      id: 'state-flags',
      prompt: 'Как избавиться от флагов isLoading, isError, isDone, которые дают невозможные комбинации?',
      options: [
        'Добавить ещё один флаг isValid',
        'Смоделировать состояние discriminated union и переходы функцией (конечный автомат)',
        'Хранить флаги в localStorage',
        'Использовать enum с битовыми флагами',
      ],
      correctIndex: 1,
      explanation: 'Каждое состояние несёт только свои данные, недопустимые комбинации непредставимы. Это паттерн State.',
    },
    {
      id: 'command-undo',
      prompt: 'Какой паттерн естественно реализует undo/redo?',
      options: ['Observer', 'Command (или снимки — Memento)', 'Adapter', 'Proxy'],
      correctIndex: 1,
      explanation: 'Действие как объект с `execute`/`undo` и два стека; или хранение снимков иммутабельного состояния.',
    },
    {
      id: 'adapter-dto',
      prompt: 'Маппинг ответа API (snake_case, строки дат) в доменную модель — это какой паттерн?',
      options: ['Adapter', 'Mediator', 'Template Method', 'Singleton'],
      correctIndex: 0,
      explanation: 'Адаптер на границе: формат бэкенда не протекает в компоненты, изменения API правятся в одном месте.',
    },
  ],
} as const satisfies Quiz;

export const ARCHITECTURE_QUIZ = {
  trackId: 'architecture',
  questions: [
    {
      id: 'mvvm',
      prompt: 'На какой UI-паттерн больше всего похож Angular?',
      options: ['MVC', 'MVVM', 'MVP', 'Flux'],
      correctIndex: 1,
      explanation: 'Шаблон — View, класс компонента — ViewModel, биндинги — связывание данных, сервисы — Model.',
    },
    {
      id: 'dependency-rule',
      prompt: 'Что гласит правило зависимостей чистой архитектуры?',
      options: [
        'UI зависит от базы данных',
        'Зависимости направлены внутрь: домен не знает о фреймворке и инфраструктуре',
        'Все слои зависят друг от друга',
        'Инфраструктура определяет интерфейсы домена',
      ],
      correctIndex: 1,
      explanation: 'Внутренние слои объявляют порты, внешние их реализуют; DI связывает их.',
    },
    {
      id: 'bounded-context',
      prompt: 'Что такое bounded context в DDD?',
      options: [
        'Область видимости переменной',
        'Граница, внутри которой модель и термины предметной области однозначны',
        'Модуль Angular',
        'Транзакция базы данных',
      ],
      correctIndex: 1,
      explanation: '«Товар» в каталоге и на складе — разные модели. Во фронтенде контексты становятся границами фич и микрофронтендов.',
    },
    {
      id: 'bff',
      prompt: 'Чем BFF отличается от API Gateway?',
      options: [
        'Ничем',
        'BFF — бэкенд под конкретный клиент, агрегирующий данные под его экраны; Gateway — общая точка входа (маршрутизация, auth, rate limit)',
        'BFF работает только с GraphQL',
        'Gateway пишет команда фронтенда',
      ],
      correctIndex: 1,
      explanation: 'Часто используются вместе: клиент → BFF → gateway → сервисы.',
    },
    {
      id: 'saga',
      prompt: 'Как обеспечить согласованность данных между микросервисами без распределённой транзакции?',
      options: ['Двухфазный коммит во всех сервисах', 'Saga с компенсирующими действиями', 'Общая база данных', 'Синхронные вызовы с таймаутом'],
      correctIndex: 1,
      explanation: 'Локальные транзакции + компенсации; координация — хореографией событий или оркестратором.',
    },
    {
      id: 'idempotency',
      prompt: 'Почему потребители сообщений из брокера должны быть идемпотентными?',
      options: [
        'Для скорости',
        'Стандартная гарантия — at-least-once: сообщение может прийти повторно',
        'Kafka требует этого синтаксически',
        'Чтобы не использовать базу данных',
      ],
      correctIndex: 1,
      explanation: 'Дедупликация по id сообщения или Idempotency-Key делает повтор безопасным.',
    },
    {
      id: 'microfrontends-when',
      prompt: 'Когда микрофронтенды оправданы?',
      options: [
        'Всегда для новых проектов',
        'Когда несколько независимых команд работают над большим продуктом и нужны независимые релизы',
        'Когда приложение маленькое',
        'Когда нужно ускорить загрузку страницы',
      ],
      correctIndex: 1,
      explanation: 'Для 1–2 команд достаточно модульного монорепозитория. Микрофронтенды решают организационные задачи ценой технической сложности.',
    },
    {
      id: 'circuit-breaker',
      prompt: 'Что делает Circuit Breaker в состоянии open?',
      options: [
        'Повторяет запросы с увеличенной задержкой',
        'Сразу отклоняет вызовы, не обращаясь к упавшему сервису, до истечения таймаута',
        'Кеширует ответы',
        'Балансирует нагрузку',
      ],
      correctIndex: 1,
      explanation: 'После таймаута — half-open: пробный вызов решает, закрыть цепь или снова разомкнуть.',
    },
  ],
} as const satisfies Quiz;
