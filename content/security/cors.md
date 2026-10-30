Ошибка «has been blocked by CORS policy» — одна из самых частых в консоли фронтендера. Чтобы с ней разобраться, нужно понимать Same-Origin Policy и то, что CORS — это механизм **ослабления** ограничений, а не защиты.

## Same-Origin Policy

**Origin** = схема + хост + порт.

| URL | Тот же origin, что `https://app.example.com`? |
| --- | --- |
| `https://app.example.com/users` | да |
| `http://app.example.com` | нет — другая схема |
| `https://api.example.com` | нет — другой хост |
| `https://app.example.com:8443` | нет — другой порт |

Same-Origin Policy (SOP) запрещает скрипту одного origin **читать** ответы и данные другого origin: ответы `fetch`/XHR, DOM чужого iframe, его `localStorage`. Без SOP любой открытый сайт мог бы читать вашу почту, пока вы в неё залогинены.

Важно: SOP запрещает **чтение**, но не всегда **отправку**. Форма может отправить POST на чужой домен — отсюда CSRF.

## CORS

Cross-Origin Resource Sharing — способ, которым **сервер** разрешает браузеру отдать ответ скрипту с другого origin.

### Простой запрос

GET/HEAD/POST с «простыми» заголовками и `Content-Type` из `text/plain`, `multipart/form-data`, `application/x-www-form-urlencoded`:

```http
GET /api/products HTTP/1.1
Origin: https://app.example.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
```

Если заголовка `Access-Control-Allow-Origin` нет или он не совпадает, запрос **дойдёт до сервера и выполнится**, но браузер не отдаст ответ JavaScript.

### Preflight

Для остальных запросов (PUT, DELETE, `Content-Type: application/json`, заголовок `Authorization`, свои заголовки) браузер сначала спрашивает разрешения:

```http
OPTIONS /api/orders/42 HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: authorization, content-type
Access-Control-Max-Age: 600
```

Только после успешного preflight уходит настоящий запрос. `Access-Control-Max-Age` кеширует разрешение, чтобы не делать preflight каждый раз.

### Cookies и credentials

```ts
this.http.get('/api/me', { withCredentials: true });
fetch(url, { credentials: 'include' });
```

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

При credentials **нельзя** использовать `Access-Control-Allow-Origin: *` — только конкретный origin.

## Заголовки CORS

| Заголовок | Назначение |
| --- | --- |
| `Access-Control-Allow-Origin` | разрешённый origin (или `*` без credentials) |
| `Access-Control-Allow-Methods` | методы для preflight |
| `Access-Control-Allow-Headers` | заголовки запроса для preflight |
| `Access-Control-Allow-Credentials` | разрешить cookies/авторизацию |
| `Access-Control-Expose-Headers` | какие заголовки ответа может прочитать JS (по умолчанию — только простые) |
| `Access-Control-Max-Age` | кеш preflight |

## Типичные ошибки и решения

### «Чиним CORS на фронтенде»

CORS настраивается **только на сервере**. Заголовки `Access-Control-*` в запросе из Angular ничего не дают.

### Dev-прокси

Для разработки, когда API на другом порту, используйте прокси dev-сервера — тогда для браузера запросы идут на тот же origin:

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

```bash
ng serve --proxy-config proxy.conf.json
```

В production тот же эффект даёт reverse-proxy (nginx, CDN, BFF), раздающий фронтенд и API с одного домена.

### Отражение Origin без проверки

```js
// Опасно: разрешает любому сайту читать ответы с cookies пользователя
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

Сервер должен сверять origin с белым списком. Также опасно разрешать `null` origin (его отправляют sandbox-iframe и `file://`).

### Заголовок ответа «не виден»

```ts
response.headers.get('X-Total-Count'); // null
```

Нужен `Access-Control-Expose-Headers: X-Total-Count`.

> [!WARNING]
> CORS — не механизм защиты API. Он защищает **пользователя** от чтения его данных чужими сайтами в браузере. curl, Postman и серверный код CORS не применяют вовсе. Авторизацию, валидацию и rate limiting API обязан делать сам.

> [!INTERVIEW]
> «Что такое CORS и почему возникает ошибка?» — Браузер по Same-Origin Policy запрещает скрипту читать ответы с другого origin (схема, хост, порт). CORS — протокол, которым сервер разрешает это заголовками `Access-Control-Allow-*`. Для «непростых» запросов (JSON, Authorization, PUT/DELETE) браузер сначала отправляет preflight `OPTIONS`. Ошибка означает, что сервер не вернул нужные заголовки; исправляется на сервере или прокси с одним origin, а не на фронтенде. С credentials нельзя использовать `*`.

## Коротко

- Origin = схема + хост + порт; SOP запрещает чтение чужих ответов.
- CORS — сервер разрешает чтение заголовками `Access-Control-Allow-*`.
- Preflight `OPTIONS` для JSON, `Authorization`, PUT/DELETE.
- С credentials — только конкретный origin и `Allow-Credentials: true`.
- В разработке — `proxy.conf.json`; CORS не защищает API от curl.
