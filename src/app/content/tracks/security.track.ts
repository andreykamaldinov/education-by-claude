import type { Track } from '../../domain/catalog.model';

export const SECURITY_TRACK = {
  id: 'security',
  title: 'Безопасность',
  short: 'Sec',
  description:
    'Как атакуют фронтенд и как защищаться: XSS и санитизация в Angular, CSP, CSRF, CORS, аутентификация, хранение токенов и цепочка поставок.',
  accent: '#2E7D4F',
  onAccent: '#FFFFFF',
  status: 'ready',
  sections: [
    {
      id: 'browser-attacks',
      title: 'Атаки на браузер',
      lessons: [
        {
          id: 'xss',
          title: 'XSS и встроенная защита Angular',
          summary: 'Stored, reflected и DOM XSS, контексты безопасности и автоматическая санитизация.',
          level: 'middle',
          minutes: 14,
          tags: ['XSS', 'sanitization', 'innerHTML'],
        },
        {
          id: 'dom-sanitizer',
          title: 'DomSanitizer и bypassSecurityTrust',
          summary: 'Когда обход санитизации оправдан и как не открыть дыру.',
          level: 'middle',
          minutes: 9,
          tags: ['DomSanitizer', 'bypassSecurityTrust', 'SafeHtml'],
        },
        {
          id: 'csp-trusted-types',
          title: 'CSP и Trusted Types',
          summary: 'Content Security Policy, nonce, strict-dynamic и Trusted Types в Angular.',
          level: 'advanced',
          minutes: 12,
          tags: ['CSP', 'Trusted Types', 'nonce'],
        },
        {
          id: 'csrf',
          title: 'CSRF и SameSite',
          summary: 'Как работает подделка запросов, SameSite-cookies и XSRF-защита HttpClient.',
          level: 'middle',
          minutes: 10,
          tags: ['CSRF', 'XSRF', 'SameSite'],
        },
        {
          id: 'cors',
          title: 'Same-Origin Policy и CORS',
          summary: 'Что такое origin, preflight-запросы, заголовки CORS и типичные ошибки.',
          level: 'basic',
          minutes: 10,
          tags: ['CORS', 'SOP', 'preflight'],
        },
        {
          id: 'clickjacking-headers',
          title: 'Clickjacking и security-заголовки',
          summary: 'frame-ancestors, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
          level: 'middle',
          minutes: 8,
          tags: ['clickjacking', 'HSTS', 'headers'],
        },
      ],
    },
    {
      id: 'auth',
      title: 'Аутентификация',
      lessons: [
        {
          id: 'auth',
          title: 'JWT, OAuth 2.0, OIDC и PKCE',
          summary: 'Аутентификация против авторизации, устройство JWT и поток Authorization Code + PKCE для SPA.',
          level: 'advanced',
          minutes: 16,
          tags: ['JWT', 'OAuth', 'OIDC', 'PKCE'],
        },
        {
          id: 'token-storage',
          title: 'Где хранить токены',
          summary: 'localStorage против httpOnly cookie, BFF-паттерн, refresh-токены и ротация.',
          level: 'advanced',
          minutes: 10,
          tags: ['localStorage', 'httpOnly', 'BFF', 'refresh token'],
        },
      ],
    },
    {
      id: 'process',
      title: 'Процессы',
      lessons: [
        {
          id: 'owasp-frontend',
          title: 'OWASP Top 10 глазами фронтендера',
          summary: 'Какие пункты касаются клиента и что с ними делать в Angular-проекте.',
          level: 'middle',
          minutes: 11,
          tags: ['OWASP', 'checklist'],
        },
        {
          id: 'supply-chain',
          title: 'Безопасность зависимостей',
          summary: 'npm audit, lock-файлы, typosquatting, SRI, Renovate и минимизация зависимостей.',
          level: 'middle',
          minutes: 9,
          tags: ['npm audit', 'supply chain', 'SRI'],
        },
      ],
    },
  ],
} as const satisfies Track;
