Часть защиты веб-приложения настраивается не в коде, а заголовками HTTP-ответа. Они дешёвые, не требуют изменений в Angular и закрывают целые классы атак. Этот урок — справочник по основным security-заголовкам.

## Clickjacking

Злоумышленник встраивает ваш сайт в невидимый `<iframe>` поверх своей страницы и заставляет пользователя кликнуть по «безобидной» кнопке, а на самом деле — по кнопке «Удалить аккаунт» или «Подтвердить платёж» вашего сайта.

```html
<!-- evil.example -->
<button>Получить приз</button>
<iframe src="https://bank.example/transfer?to=attacker" style="opacity:0; position:absolute; top:0"></iframe>
```

### Защита

```http
Content-Security-Policy: frame-ancestors 'none'
```

или, если сайт должен встраиваться в собственные страницы:

```http
Content-Security-Policy: frame-ancestors 'self' https://partner.example
```

Устаревший, но ещё распространённый аналог: `X-Frame-Options: DENY` / `SAMEORIGIN`. Если поддерживаются оба, `frame-ancestors` приоритетнее.

> [!NOTE]
> `frame-ancestors` работает только как HTTP-заголовок, не через `<meta http-equiv>`.

## Strict-Transport-Security (HSTS)

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Браузер запоминает, что сайт доступен только по HTTPS, и на указанный срок автоматически заменяет `http://` на `https://`, не позволяя открыть сайт по незащищённому соединению. Защищает от SSL stripping в публичных сетях Wi-Fi.

`preload` + регистрация на hstspreload.org — HTTPS обязателен даже при самом первом визите.

## X-Content-Type-Options

```http
X-Content-Type-Options: nosniff
```

Запрещает браузеру «угадывать» тип содержимого. Без него загруженный пользователем файл `avatar.jpg` с JavaScript внутри мог быть выполнен как скрипт.

## Referrer-Policy

```http
Referrer-Policy: strict-origin-when-cross-origin
```

Определяет, сколько информации об URL уходит в заголовке `Referer`. Важно, если в URL бывают токены, идентификаторы или поисковые запросы: при переходе на внешний сайт они утекут. `strict-origin-when-cross-origin` — разумный вариант по умолчанию (на чужие сайты — только origin).

## Permissions-Policy

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self "https://pay.example")
```

Отключает браузерные возможности для страницы и встроенных iframe. Если сторонний скрипт будет скомпрометирован, он не сможет запросить камеру.

## Cross-Origin изоляция

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

| Заголовок | Что делает |
| --- | --- |
| COOP | разрывает связь `window.opener` с окнами других origin — защита от атак через вкладки |
| COEP | страница загружает только ресурсы, явно разрешившие это (CORS или CORP) |
| CORP | ресурс можно загрузить только с указанных origin |

COOP + COEP включают **cross-origin isolation**, нужную для `SharedArrayBuffer` и точных таймеров (защита от Spectre).

## Cookies

```http
Set-Cookie: __Host-session=abc; Path=/; Secure; HttpOnly; SameSite=Lax
```

Префикс `__Host-` требует `Secure`, `Path=/` и запрещает `Domain` — cookie нельзя подменить с поддомена.

## Ссылки на внешние сайты

```html
<a href="https://external.example" target="_blank" rel="noopener noreferrer">…</a>
```

Без `noopener` открытая страница получает `window.opener` и может перенаправить вашу вкладку на фишинговую копию (tabnabbing). Современные браузеры применяют `noopener` к `target="_blank"` по умолчанию, но явное указание не помешает. На этой платформе все внешние ссылки в уроках получают `rel="noopener noreferrer"` при рендеринге Markdown.

## Пример набора для Angular SPA за nginx

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
```

> [!TIP]
> Проверить заголовки сайта можно сервисами вроде securityheaders.com и Mozilla HTTP Observatory, а также вкладкой Network в DevTools.

> [!INTERVIEW]
> «Что такое clickjacking и как защититься?» — Атака, при которой ваш сайт встраивается в невидимый iframe на чужой странице, и пользователь, думая, что кликает по элементу злоумышленника, на самом деле нажимает кнопку на вашем сайте. Защита — заголовок `Content-Security-Policy: frame-ancestors 'none'` (или список разрешённых родителей), устаревший аналог — `X-Frame-Options: DENY`.

## Коротко

- Clickjacking — `frame-ancestors 'none'` (или `X-Frame-Options`).
- HSTS — только HTTPS; `nosniff` — без угадывания типов.
- `Referrer-Policy` — не утекают URL с данными; `Permissions-Policy` — отключены ненужные API.
- COOP/COEP/CORP — изоляция между origin.
- Cookie с префиксом `__Host-`, внешние ссылки с `rel="noopener"`.
