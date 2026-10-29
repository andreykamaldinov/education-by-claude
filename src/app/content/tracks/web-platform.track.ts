import type { Track } from '../../domain/catalog.model';

export const WEB_PLATFORM_TRACK = {
  id: 'web',
  title: 'Браузер и сеть',
  short: 'Web',
  description:
    'Что происходит между вводом URL и первым кадром: рендеринг, HTTP, кеширование, Web Vitals, хранилища и воркеры.',
  accent: '#2C6FB7',
  onAccent: '#FFFFFF',
  status: 'ready',
  sections: [
    {
      id: 'browser',
      title: 'Браузер',
      lessons: [
        {
          id: 'rendering',
          title: 'Как браузер рисует страницу',
          summary: 'Critical rendering path, layout, paint, composite, reflow и как их избегать.',
          level: 'middle',
          minutes: 13,
          tags: ['rendering', 'reflow', 'repaint', 'CRP'],
        },
        {
          id: 'web-vitals',
          title: 'Core Web Vitals',
          summary: 'LCP, INP, CLS: что измеряют, как замерить и как улучшить в Angular.',
          level: 'middle',
          minutes: 10,
          tags: ['LCP', 'INP', 'CLS', 'performance'],
        },
        {
          id: 'storage',
          title: 'Хранилища браузера',
          summary: 'Cookies, localStorage, sessionStorage, IndexedDB, Cache API: лимиты и безопасность.',
          level: 'basic',
          minutes: 8,
          tags: ['cookies', 'localStorage', 'IndexedDB'],
        },
        {
          id: 'workers',
          title: 'Web Workers и Service Workers',
          summary: 'Вынос вычислений из главного потока, офлайн и PWA.',
          level: 'middle',
          minutes: 9,
          tags: ['Web Worker', 'Service Worker', 'PWA'],
        },
      ],
    },
    {
      id: 'network',
      title: 'Сеть',
      lessons: [
        {
          id: 'http',
          title: 'HTTP/1.1, HTTP/2, HTTP/3 и кеширование',
          summary: 'Методы, статусы, заголовки кеширования, ETag, мультиплексирование и QUIC.',
          level: 'middle',
          minutes: 13,
          tags: ['HTTP', 'cache', 'ETag', 'HTTP/2'],
        },
        {
          id: 'realtime',
          title: 'WebSocket, SSE и long polling',
          summary: 'Двусторонняя связь в реальном времени: что выбрать и как подружить с RxJS.',
          level: 'middle',
          minutes: 9,
          tags: ['WebSocket', 'SSE', 'polling'],
        },
      ],
    },
  ],
} as const satisfies Track;
