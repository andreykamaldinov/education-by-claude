import type { Quiz } from '../../domain/quiz.model';

export const TOOLING_QUIZ = {
  trackId: 'tooling',
  questions: [
    {
      id: 'tree-shaking',
      prompt: 'Что мешает tree-shaking?',
      options: [
        'ES-модули',
        'CommonJS-зависимости и побочные эффекты на верхнем уровне модулей',
        'Использование TypeScript',
        'Ленивые маршруты',
      ],
      correctIndex: 1,
      explanation: 'Tree-shaking опирается на статическую структуру import/export. Пакеты помечают отсутствие эффектов полем sideEffects: false.',
    },
    {
      id: 'loader-plugin',
      prompt: 'Чем loader отличается от plugin в Webpack?',
      options: [
        'Ничем',
        'Loader преобразует отдельный файл при импорте, plugin работает с хуками всей компиляции',
        'Plugin работает только с CSS',
        'Loader выполняется после минификации',
      ],
      correctIndex: 1,
      explanation: 'Цепочка loaders применяется справа налево: sass-loader → css-loader → style-loader.',
    },
    {
      id: 'vite-dev',
      prompt: 'Почему dev-сервер Vite стартует быстро на больших проектах?',
      options: [
        'Он кеширует всё в облаке',
        'Он не собирает бандл: браузер грузит нативные ES-модули, а Vite трансформирует файлы по запросу',
        'Он пропускает TypeScript',
        'Он использует Webpack в фоне',
      ],
      correctIndex: 1,
      explanation: 'Зависимости из node_modules один раз пред-собираются в ESM; HMR обновляет только изменённый модуль.',
    },
    {
      id: 'nx-affected',
      prompt: 'Что делает nx affected -t test?',
      options: [
        'Запускает все тесты',
        'Запускает тесты изменённых проектов и всех, кто от них зависит',
        'Запускает только упавшие тесты',
        'Обновляет снапшоты',
      ],
      correctIndex: 1,
      explanation: 'Nx сравнивает git-дифф с базой и обходит граф проектов. Плюс кеш по хешу входов.',
    },
    {
      id: 'module-boundaries',
      prompt: 'Как запретить ui-библиотеке импортировать data-access в Nx?',
      options: [
        'Договориться устно',
        'Теги type:ui / type:data-access и правило @nx/enforce-module-boundaries',
        'Удалить tsconfig paths',
        'Вынести в отдельный репозиторий',
      ],
      correctIndex: 1,
      explanation: 'Правило также запрещает глубокие импорты в обход index.ts и циклы между проектами.',
    },
    {
      id: 'shared-singleton',
      prompt: 'Почему @angular/core в Module/Native Federation должен быть singleton?',
      options: [
        'Чтобы бандл был меньше на 1 КБ',
        'Два экземпляра Angular на странице дают разные DI и роутеры — NullInjectorError и неработающее приложение',
        'Этого требует лицензия',
        'Иначе не работает TypeScript',
      ],
      correctIndex: 1,
      explanation: 'Плюс strictVersion: true — лучше явная ошибка при несовместимых версиях.',
    },
    {
      id: 'native-federation',
      prompt: 'На чём основана Native Federation?',
      options: ['На рантайме Webpack', 'На ES-модулях и import maps', 'На iframe', 'На Web Workers'],
      correctIndex: 1,
      explanation: 'Поэтому она работает со стандартной esbuild-сборкой Angular CLI, включая SSR.',
    },
    {
      id: 'remote-entry',
      prompt: 'Зачем shell-приложению манифест с адресами remote-ов, читаемый при старте?',
      options: [
        'Для SEO',
        'Чтобы один собранный shell работал в любом окружении, а remote можно было откатить сменой URL',
        'Для ускорения сборки',
        'Чтобы отключить кеширование',
      ],
      correctIndex: 1,
      explanation: 'Динамическая федерация: адреса не зашиты в бандл.',
    },
  ],
} as const satisfies Quiz;

export const AI_MCP_QUIZ = {
  trackId: 'ai-mcp',
  questions: [
    {
      id: 'mcp-what',
      prompt: 'Какую проблему решает Model Context Protocol?',
      options: [
        'Ускоряет инференс моделей',
        'Стандартизирует подключение AI-приложений к инструментам и данным: N×M интеграций превращаются в N+M',
        'Шифрует промпты',
        'Заменяет REST API',
      ],
      correctIndex: 1,
      explanation: 'Сервис реализует MCP-сервер один раз и работает со всеми совместимыми клиентами.',
    },
    {
      id: 'primitives',
      prompt: 'Кто управляет вызовом tools в MCP?',
      options: ['Пользователь', 'Модель (с разрешения host-а)', 'Сервер сам по таймеру', 'Браузер'],
      correctIndex: 1,
      explanation: 'Tools — для модели, resources — для приложения, prompts — для пользователя.',
    },
    {
      id: 'transports',
      prompt: 'Какой транспорт используют локальные MCP-серверы вроде Angular CLI MCP?',
      options: ['WebSocket', 'stdio', 'gRPC', 'SMTP'],
      correctIndex: 1,
      explanation: 'Host запускает сервер дочерним процессом. Удалённые серверы используют Streamable HTTP с OAuth 2.1.',
    },
    {
      id: 'stdio-log',
      prompt: 'Почему в stdio MCP-сервере нельзя писать console.log?',
      options: [
        'console.log запрещён в Node.js',
        'stdout занят сообщениями протокола — лишний вывод сломает обмен; логи пишут в stderr',
        'Это раскроет токены',
        'Это замедлит сервер',
      ],
      correctIndex: 1,
      explanation: 'Используйте console.error или логгер в файл.',
    },
    {
      id: 'stateless',
      prompt: 'Что принципиально изменилось в ревизии MCP 2026-07-28?',
      options: [
        'Протокол перешёл на XML',
        'Протокол стал stateless: нет handshake initialize и сессий, возможности — через server/discover',
        'Удалены tools',
        'Требуется WebSocket',
      ],
      correctIndex: 1,
      explanation: 'Любой экземпляр сервера обслуживает любой запрос — проще масштабирование за балансировщиком.',
    },
    {
      id: 'tool-error',
      prompt: 'Инструмент не нашёл задачу по id. Как вернуть ошибку?',
      options: [
        'JSON-RPC error с кодом -32601',
        'Результат с isError: true и понятным текстом — чтобы модель увидела ошибку и исправилась',
        'Закрыть соединение',
        'Вернуть пустую строку',
      ],
      correctIndex: 1,
      explanation: 'JSON-RPC ошибки — для проблем протокола (неизвестный метод, неверные параметры запроса).',
    },
    {
      id: 'lethal-trifecta',
      prompt: 'Какое сочетание делает prompt injection особенно опасной?',
      options: [
        'Медленная сеть и большой контекст',
        'Доступ к приватным данным + недоверенный контент + возможность отправить данные наружу',
        'Использование TypeScript и Zod',
        'Локальный сервер и stdio',
      ],
      correctIndex: 1,
      explanation: 'Уберите хотя бы один элемент триады — утечка станет невозможной. Надёжной фильтрации инъекций не существует.',
    },
    {
      id: 'angular-mcp',
      prompt: 'Что даёт подключение Angular CLI MCP-сервера к ассистенту в IDE?',
      options: [
        'Автоматический деплой',
        'Актуальные best practices и документацию вашей версии, сведения о проектах, запуск сборки/тестов, план миграции на zoneless',
        'Доступ к продакшен-базе',
        'Генерацию дизайна',
      ],
      correctIndex: 1,
      explanation: 'Флаги --read-only и --local-only ограничивают набор инструментов.',
    },
  ],
} as const satisfies Quiz;
