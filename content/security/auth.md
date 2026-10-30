Аутентификация отвечает на вопрос «кто вы», авторизация — «что вам можно». Во фронтенде с ними связаны JWT, OAuth 2.0, OpenID Connect и PKCE — набор терминов, который часто путают. Разберём, кто есть кто и какой поток правильный для SPA.

## Аутентификация, авторизация, сессия

| Понятие | Вопрос | Пример |
| --- | --- | --- |
| Аутентификация (AuthN) | кто вы? | вход по паролю, SSO, passkey |
| Авторизация (AuthZ) | что вам разрешено? | роль `admin`, доступ к заказу 42 |
| Сессия | как помнить, что вы уже вошли? | cookie с id сессии или токен |

## Сессии против токенов

**Серверная сессия**: после входа сервер создаёт запись сессии, отдаёт её id в `HttpOnly`-cookie, при каждом запросе ищет сессию в хранилище. Легко отозвать, но нужно общее хранилище сессий.

**Токены (обычно JWT)**: сервер выдаёт подписанный токен с данными пользователя; проверка — по подписи, без похода в базу. Хорошо масштабируется между сервисами, но отозвать выпущенный токен до истечения срока сложно.

## JWT

JSON Web Token — три части в base64url через точку: `header.payload.signature`.

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc5MzI3MDAwMH0.signature
```

```json
// header
{ "alg": "RS256", "typ": "JWT", "kid": "key-2026-10" }
// payload (claims)
{ "sub": "42", "role": "admin", "iss": "https://auth.example.com", "aud": "api", "exp": 1793270000, "iat": 1793266400 }
```

- **Подпись** гарантирует целостность: изменить payload без ключа нельзя.
- **Payload не зашифрован** — его может прочитать кто угодно. Не кладите туда секреты и персональные данные.
- Сервер обязан проверять подпись, алгоритм (не принимать `alg: none`), `exp`, `iss`, `aud`.

```ts
// Прочитать claims на клиенте для UI (не для безопасности!)
const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
```

> [!WARNING]
> Решения о доступе к данным принимает сервер. Клиент может показать или скрыть кнопку по роли из токена, но злоумышленник отправит запрос напрямую.

## Access и refresh токены

| Токен | Срок жизни | Назначение |
| --- | --- | --- |
| Access token | короткий (5–15 мин) | доступ к API, отправляется с каждым запросом |
| Refresh token | длинный (дни–недели) | получение нового access token, отправляется только на сервер авторизации |

Короткий access-токен ограничивает ущерб при утечке. **Ротация refresh-токенов**: каждый refresh выдаёт новый refresh-токен, старый становится недействительным; повторное использование старого — признак кражи, сервер отзывает всю цепочку.

## OAuth 2.0

OAuth 2.0 — протокол **делегированной авторизации**: приложение получает ограниченный доступ к ресурсам пользователя (scopes), не узнавая его пароль.

Роли:

- **Resource Owner** — пользователь.
- **Client** — ваше приложение.
- **Authorization Server** — выдаёт токены (Keycloak, Auth0, Entra ID, Google).
- **Resource Server** — API, принимающее токены.

## OpenID Connect

OAuth сам по себе не сообщает, **кто** пользователь. OIDC — слой поверх OAuth 2.0 для аутентификации: добавляет **ID token** (JWT с данными о пользователе), scope `openid`, endpoint `userinfo` и стандартный discovery (`/.well-known/openid-configuration`).

## Authorization Code + PKCE — поток для SPA

Устаревший Implicit flow (токен прямо в URL) больше не рекомендуется. Для SPA и мобильных приложений — **Authorization Code с PKCE** (Proof Key for Code Exchange).

```text
1. SPA генерирует случайный code_verifier и code_challenge = BASE64URL(SHA256(code_verifier))
2. Редирект на сервер авторизации:
   /authorize?response_type=code&client_id=spa&redirect_uri=https://app/callback
             &scope=openid profile api&state=xyz&code_challenge=...&code_challenge_method=S256
3. Пользователь входит, сервер редиректит назад: https://app/callback?code=abc&state=xyz
4. SPA проверяет state и обменивает code на токены, отправляя code_verifier:
   POST /token  { grant_type=authorization_code, code=abc, code_verifier=..., redirect_uri=... }
5. Сервер проверяет, что SHA256(code_verifier) == code_challenge, и выдаёт токены
```

- **PKCE** защищает от перехвата `code`: без `code_verifier`, который никогда не покидал приложение, код бесполезен.
- **state** защищает от CSRF при входе.
- **nonce** (OIDC) защищает ID token от повторного использования.

```ts
async function createPkcePair() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
```

В Angular-проектах обычно используют готовые библиотеки (`angular-oauth2-oidc`, `angular-auth-oidc-client`) — они реализуют PKCE, обновление токенов и проверку ID token.

## BFF: токены не в браузере

Современная рекомендация для SPA с высокими требованиями к безопасности — **Backend for Frontend**: OAuth-клиентом выступает ваш сервер, токены хранятся на нём, а браузер получает только `HttpOnly`-cookie сессии. Подробнее — в уроке [Где хранить токены](/tracks/security/token-storage).

## Passkeys

Вход без пароля на основе WebAuthn: устройство хранит приватный ключ, сервер — публичный. Фишинг невозможен (ключ привязан к домену), утечка базы сервера не раскрывает секретов.

```ts
const credential = await navigator.credentials.get({ publicKey: optionsFromServer });
```

> [!INTERVIEW]
> «Чем OAuth 2.0 отличается от OpenID Connect и зачем PKCE?» — OAuth 2.0 — протокол делегированной авторизации: приложение получает access token со scopes для доступа к API от имени пользователя. OIDC добавляет поверх него аутентификацию: ID token с информацией о пользователе и стандартные endpoints. PKCE защищает поток Authorization Code для публичных клиентов (SPA, мобильных): клиент отправляет хеш случайного секрета при авторизации и сам секрет при обмене кода на токены, поэтому перехваченный код бесполезен.

## Коротко

- AuthN — кто вы, AuthZ — что можно; решения о доступе — на сервере.
- JWT подписан, но не зашифрован; сервер проверяет подпись, `exp`, `iss`, `aud`.
- Короткий access + refresh с ротацией.
- OAuth 2.0 — делегирование доступа, OIDC — аутентификация поверх него.
- Для SPA — Authorization Code + PKCE (или BFF), Implicit flow устарел.
