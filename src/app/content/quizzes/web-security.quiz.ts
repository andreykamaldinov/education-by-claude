import type { Quiz } from '../../domain/quiz.model';

export const WEB_QUIZ = {
  trackId: 'web',
  questions: [
    {
      id: 'animate-props',
      prompt: 'Какие CSS-свойства лучше всего анимировать для плавности?',
      options: ['width и height', 'top и left', 'transform и opacity', 'margin и padding'],
      correctIndex: 2,
      explanation:
        '`transform` и `opacity` обрабатываются на этапе композиции (часто на GPU) без layout и paint. Изменение геометрии вызывает reflow.',
    },
    {
      id: 'layout-thrashing',
      prompt: 'Что такое layout thrashing?',
      options: [
        'Слишком частая сборка мусора',
        'Чередование записи стилей и чтения геометрии, вызывающее принудительный layout на каждой итерации',
        'Ошибка CSS Grid',
        'Мерцание шрифтов при загрузке',
      ],
      correctIndex: 1,
      explanation: 'Сначала выполняйте все чтения (offsetHeight, getBoundingClientRect), затем все записи.',
    },
    {
      id: 'inp',
      prompt: 'Что измеряет INP?',
      options: [
        'Время до первого байта',
        'Задержку от взаимодействия пользователя до следующей отрисовки',
        'Сдвиги макета',
        'Время загрузки самого большого изображения',
      ],
      correctIndex: 1,
      explanation: 'INP (≤ 200 мс — хорошо) заменил FID. Улучшается дроблением длинных задач и облегчением обработчиков.',
    },
    {
      id: 'cache-index',
      prompt: 'Какой Cache-Control правильный для index.html Angular-приложения?',
      options: ['max-age=31536000, immutable', 'no-cache', 'public, max-age=86400', 'Не указывать заголовок'],
      correctIndex: 1,
      explanation:
        '`index.html` ссылается на бандлы с хешами — он должен валидироваться при каждом заходе, иначе пользователи не получат новую версию. Хешированные бандлы — наоборот, `immutable` на год.',
    },
    {
      id: 'http2',
      prompt: 'Что главное даёт HTTP/2 по сравнению с HTTP/1.1?',
      options: [
        'Шифрование',
        'Мультиплексирование многих запросов в одном соединении и сжатие заголовков',
        'Передачу по UDP',
        'Поддержку WebSocket',
      ],
      correctIndex: 1,
      explanation: 'HTTP/3 дополнительно переходит на QUIC (UDP) и убирает head-of-line blocking на уровне транспорта.',
    },
    {
      id: 'sse-vs-ws',
      prompt: 'Нужно стримить ответ сервера (уведомления, токены LLM) только от сервера к клиенту. Что проще?',
      options: ['WebSocket', 'Server-Sent Events или fetch-стриминг', 'Long polling каждые 100 мс', 'WebRTC'],
      correctIndex: 1,
      explanation: 'SSE работает поверх обычного HTTP, с автоматическим переподключением. WebSocket нужен для двустороннего обмена.',
    },
  ],
} as const satisfies Quiz;

export const SECURITY_QUIZ = {
  trackId: 'security',
  questions: [
    {
      id: 'angular-xss',
      prompt: 'Как Angular защищает от XSS по умолчанию?',
      options: [
        'Шифрует все строки',
        'Экранирует интерполяцию и санитизирует значения в опасных контекстах (HTML, style, URL)',
        'Запрещает innerHTML полностью',
        'Использует CSP автоматически',
      ],
      correctIndex: 1,
      explanation:
        'Интерполяция выводит текст, `[innerHTML]` санитизируется, `javascript:`-URL блокируются, resource URL требуют явного доверия. Подробнее — [XSS](/tracks/security/xss).',
    },
    {
      id: 'bypass',
      prompt: 'Когда допустимо использовать bypassSecurityTrustHtml?',
      options: [
        'Чтобы убрать предупреждение «sanitizing HTML stripped some content»',
        'Для HTML из полей пользователя',
        'Только для доверенного значения: статической строки или результата надёжной санитизации по белому списку',
        'Всегда, если данные пришли с нашего сервера',
      ],
      correctIndex: 2,
      explanation: '`bypass*` отключает защиту и ничего не проверяет. Каждое использование — с обоснованием и ревью.',
    },
    {
      id: 'csrf-angular',
      prompt: 'Как HttpClient помогает защититься от CSRF?',
      options: [
        'Шифрует cookies',
        'Читает cookie XSRF-TOKEN и отправляет её значение в заголовке X-XSRF-TOKEN для мутирующих запросов на свой origin',
        'Блокирует запросы с других сайтов',
        'Добавляет SameSite к cookies',
      ],
      correctIndex: 1,
      explanation:
        'Чужой сайт не может прочитать cookie вашего домена, а значит, не подставит заголовок. Проверку сравнения выполняет сервер.',
    },
    {
      id: 'cors-fix',
      prompt: 'В консоли «blocked by CORS policy». Где это исправляется?',
      options: [
        'Добавить заголовки Access-Control-* в запрос Angular',
        'На сервере (или прокси с одним origin)',
        'Отключить CORS в angular.json',
        'Использовать JSONP',
      ],
      correctIndex: 1,
      explanation:
        'CORS — разрешение, которое выдаёт сервер заголовками ответа. В разработке помогает `proxy.conf.json`, в продакшене — reverse proxy или корректные заголовки.',
    },
    {
      id: 'token-storage',
      prompt: 'Главный риск хранения access-токена в localStorage?',
      options: [
        'Он удалится при перезагрузке',
        'Любой XSS может прочитать токен и использовать его вне вашего сайта',
        'Его автоматически отправляет браузер',
        'localStorage медленный',
      ],
      correctIndex: 1,
      explanation:
        'HttpOnly-cookie недоступна JS, но требует CSRF-защиты. Компромисс — access в памяти и refresh в HttpOnly-cookie; самый строгий — BFF.',
    },
    {
      id: 'pkce',
      prompt: 'Какой OAuth-поток рекомендуется для SPA?',
      options: ['Implicit flow', 'Password grant', 'Authorization Code + PKCE (или BFF)', 'Client credentials'],
      correctIndex: 2,
      explanation: 'Implicit flow устарел. PKCE защищает код авторизации от перехвата: без code_verifier код бесполезен.',
    },
    {
      id: 'clickjacking',
      prompt: 'Какой заголовок защищает от clickjacking?',
      options: ['Strict-Transport-Security', "Content-Security-Policy: frame-ancestors 'none'", 'X-Content-Type-Options', 'Referrer-Policy'],
      correctIndex: 1,
      explanation: 'Устаревший аналог — `X-Frame-Options: DENY`. `frame-ancestors` работает только как HTTP-заголовок.',
    },
    {
      id: 'secrets-bundle',
      prompt: 'Можно ли хранить секретный API-ключ в environment.prod.ts?',
      options: [
        'Да, файл не попадает в git',
        'Да, если включить минификацию',
        'Нет: всё в бандле публично',
        'Да, Angular шифрует environment',
      ],
      correctIndex: 2,
      explanation: 'Секреты живут на сервере. Браузеру отдаются только публичные ключи с ограничениями по домену и квоте.',
    },
  ],
} as const satisfies Quiz;
