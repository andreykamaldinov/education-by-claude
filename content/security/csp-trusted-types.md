Content Security Policy (CSP) — заголовок ответа, которым сервер сообщает браузеру, откуда разрешено загружать скрипты, стили, изображения и куда можно отправлять запросы. Это второй эшелон защиты от XSS: даже если вредоносный тег попал на страницу, браузер откажется его выполнять.

## Заголовок CSP

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: https://cdn.example.com;
  font-src 'self';
  connect-src 'self' https://api.example.com wss://ws.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests
```

| Директива | Что ограничивает |
| --- | --- |
| `default-src` | значение по умолчанию для всех `*-src` |
| `script-src` | откуда выполнять JS; запрещает inline и `eval`, если не разрешено явно |
| `style-src` | стили |
| `connect-src` | `fetch`, XHR, WebSocket, EventSource |
| `img-src`, `font-src`, `media-src` | ресурсы |
| `frame-src` | что можно встраивать в iframe |
| `frame-ancestors` | кто может встраивать **нас** (защита от clickjacking) |
| `base-uri` | ограничивает `<base>` (защита от подмены относительных URL) |
| `form-action` | куда можно отправлять формы |
| `object-src 'none'` | запрет плагинов |

Ключевые слова: `'self'` (свой origin), `'none'`, `'unsafe-inline'`, `'unsafe-eval'`, `'nonce-...'`, `'sha256-...'`, `'strict-dynamic'`.

> [!WARNING]
> `script-src 'unsafe-inline'` практически отменяет защиту от XSS: внедрённый `<script>` и `onerror="..."` выполнятся. `'unsafe-eval'` разрешает `eval` и `new Function`.

## Nonce и strict-dynamic

Современный подход — **строгая CSP** на nonce: сервер генерирует случайное значение на каждый ответ и помечает им разрешённые скрипты.

```http
Content-Security-Policy: script-src 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'
```

```html
<script nonce="r4nd0m" src="/main.js"></script>
```

- Скрипт без правильного nonce не выполнится — злоумышленник не знает значение.
- `'strict-dynamic'` разрешает скриптам с nonce загружать другие скрипты (ленивые чанки), без перечисления доменов.

### Nonce в Angular

Angular вставляет инлайновые `<style>` для стилей компонентов. С CSP без `'unsafe-inline'` для стилей им нужен nonce:

```html
<!-- index.html: сервер подставляет случайное значение в каждый ответ -->
<app-root ngCspNonce="{{SERVER_NONCE}}"></app-root>
```

или через токен:

```ts
bootstrapApplication(App, { providers: [{ provide: CSP_NONCE, useValue: globalThis.myNonce }] });
```

При SSR и `"security": { "autoCsp": true }` в `angular.json` CLI может автоматически сгенерировать хеш-основанную CSP для инлайновых скриптов загрузчика.

## Режим отчётов

Внедрять CSP на работающий проект лучше постепенно:

```http
Content-Security-Policy-Report-Only: script-src 'self'; report-to csp-endpoint
Reporting-Endpoints: csp-endpoint="https://example.com/csp-reports"
```

Браузер ничего не блокирует, но присылает отчёты о нарушениях. Когда отчёты затихнут — переключиться на обычный заголовок.

## Trusted Types

CSP контролирует, **откуда** загружать скрипты. Но DOM-XSS происходит внутри вашего же кода: `element.innerHTML = data`. Trusted Types закрывают эту дыру на уровне браузера: опасные sink-и (`innerHTML`, `outerHTML`, `document.write`, `script.src`, `eval`) перестают принимать строки и требуют объекты `TrustedHTML`/`TrustedScript`/`TrustedScriptURL`, созданные через зарегистрированную политику.

```http
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types angular myapp-markdown
```

```ts
const policy = trustedTypes.createPolicy('myapp-markdown', {
  createHTML: (input) => DOMPurify.sanitize(input),
});

element.innerHTML = policy.createHTML(markdownHtml); // ок
element.innerHTML = '<b>строка</b>'; // TypeError: This document requires 'TrustedHTML' assignment
```

Все места, где строка превращается в HTML, сосредоточены в нескольких политиках — их легко проверить на ревью.

### Trusted Types в Angular

Angular поддерживает Trusted Types из коробки и создаёт политики:

| Политика | Для чего |
| --- | --- |
| `angular` | значения, прошедшие санитизацию Angular |
| `angular#unsafe-bypass` | значения из `bypassSecurityTrust*` |
| `angular#unsafe-jit` | JIT-компилятор (в production не нужен) |
| `angular#auto-csp` | загрузчик скриптов, который CLI генерирует при `autoCsp` |

Разрешите в CSP только нужные. Не разрешив `angular#unsafe-bypass`, вы гарантируете, что ни один `bypassSecurityTrust*` не сработает.

## Пример политики для Angular SPA

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic';
  style-src 'self' 'nonce-{RANDOM}';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  require-trusted-types-for 'script';
  trusted-types angular
```

> [!TIP]
> Сторонние скрипты (аналитика, виджеты, чат поддержки) — главная причина ослабления CSP. Каждый из них — код с полным доступом к странице. Минимизируйте их список и подключайте с `integrity` (SRI), где возможно.

> [!INTERVIEW]
> «Что такое CSP и как она защищает от XSS?» — HTTP-заголовок со списком разрешённых источников для скриптов, стилей, запросов и фреймов. Строгая CSP на nonce и `strict-dynamic` без `unsafe-inline` не даёт выполниться внедрённым inline-скриптам и обработчикам, а `connect-src` мешает отправить украденные данные на чужой домен. Trusted Types дополняют CSP: запрещают передавать строки в опасные DOM-API, Angular интегрируется с ними через свои политики.

## Коротко

- CSP задаёт разрешённые источники ресурсов; `unsafe-inline` для скриптов — почти отказ от защиты.
- Строгая CSP: `nonce` + `strict-dynamic`, `object-src 'none'`, `base-uri`.
- Angular: `ngCspNonce` или `CSP_NONCE` для инлайновых стилей; `autoCsp` для SSR.
- Внедряйте через `Report-Only`.
- Trusted Types блокируют строки в опасных sink-ах; Angular имеет готовые политики.
