Браузер предоставляет несколько хранилищ с разными лимитами, временем жизни и моделью безопасности. Выбор хранилища — это не только вопрос удобства, но и безопасности (где хранить токены) и надёжности (что произойдёт в приватном режиме).

## Сравнение

| Хранилище | Объём | Время жизни | Доступ из JS | Отправляется на сервер | API |
| --- | --- | --- | --- | --- | --- |
| Cookies | ~4 КБ на cookie | до `Expires`/`Max-Age` или сессия | если не `HttpOnly` | да, с каждым запросом к домену | строка `document.cookie` |
| `localStorage` | ~5–10 МБ на origin | бессрочно | да | нет | синхронный, строки |
| `sessionStorage` | ~5–10 МБ | пока открыта вкладка | да | нет | синхронный, строки |
| IndexedDB | сотни МБ+ (квота от диска) | бессрочно (может быть вытеснено) | да | нет | асинхронный, объекты, индексы, транзакции |
| Cache API | как IndexedDB | бессрочно | да (и Service Worker) | нет | пары Request/Response |

## Cookies

```http
Set-Cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=86400
```

| Атрибут | Смысл |
| --- | --- |
| `HttpOnly` | недоступна из JavaScript — защита от кражи через XSS |
| `Secure` | только по HTTPS |
| `SameSite=Strict/Lax/None` | отправлять ли при запросах с других сайтов — защита от CSRF |
| `Domain`, `Path` | область действия |
| `Max-Age` / `Expires` | срок жизни |
| `Partitioned` | отдельное хранилище для встраиваемого контента (CHIPS) |

Cookie — единственное хранилище, которое браузер **сам отправляет** на сервер, поэтому сессии и refresh-токены обычно хранят именно в `HttpOnly`-cookie. См. [Где хранить токены](/tracks/security/token-storage).

## localStorage и sessionStorage

```ts
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme'); // 'dark' | null
localStorage.removeItem('theme');

// Объекты — только через JSON
localStorage.setItem('prefs', JSON.stringify({ fontSize: 16 }));
```

Особенности:

- **Синхронный API** блокирует главный поток — не храните там большие данные.
- Только строки.
- `sessionStorage` изолирован на вкладку; при открытии дубликата вкладки копируется.
- Событие `storage` срабатывает в **других** вкладках того же origin при изменении — способ синхронизировать вкладки.

```ts
window.addEventListener('storage', (event) => {
  if (event.key === 'logout') this.auth.logoutLocally();
});
```

> [!WARNING]
> Доступ к хранилищу может бросить исключение: приватный режим некоторых браузеров, отключённые cookies, превышение квоты, песочница iframe. Оборачивайте чтение и запись в `try/catch` и стройте приложение так, чтобы оно работало без сохранённых данных. На этой платформе прогресс хранится через такую обёртку: если хранилище недоступно, прогресс просто живёт в памяти.

> [!WARNING]
> Всё в `localStorage` доступно любому скрипту на странице. Одна XSS-уязвимость — и злоумышленник прочитает всё. Не храните там токены доступа и персональные данные без необходимости.

## IndexedDB

Асинхронная транзакционная база данных объектов с индексами. Подходит для офлайн-данных, кеша больших списков, черновиков с вложениями. Нативный API многословен, обычно используют обёртки (`idb`, Dexie):

```ts
import { openDB } from 'idb';

const db = await openDB('app', 1, {
  upgrade(db) {
    const store = db.createObjectStore('drafts', { keyPath: 'id' });
    store.createIndex('byUpdatedAt', 'updatedAt');
  },
});

await db.put('drafts', { id: 'post-1', title: 'Черновик', updatedAt: Date.now() });
const recent = await db.getAllFromIndex('drafts', 'byUpdatedAt');
```

## Cache API

Хранилище HTTP-ответов, основа офлайн-режима PWA вместе с Service Worker:

```ts
const cache = await caches.open('static-v3');
await cache.addAll(['/', '/main.js', '/styles.css']);
const response = await cache.match('/main.js');
```

## Квоты и вытеснение

- Браузер выделяет квоту на origin в зависимости от свободного места на диске.
- При нехватке места данные «best-effort» могут быть удалены (сначала у давно неиспользуемых сайтов). Safari удаляет данные сайтов, не посещённых 7 дней (при определённых условиях).
- Запросить постоянное хранение: `await navigator.storage.persist()`.
- Узнать использование: `await navigator.storage.estimate()`.

## Хранилища и SSR

На сервере `localStorage` нет. Обращение к нему в коде, который выполняется при SSR, приведёт к ошибке. Используйте `afterNextRender`, `isPlatformBrowser` или injection-токен с безопасной реализацией.

> [!INTERVIEW]
> «Чем localStorage отличается от sessionStorage и cookies?» — `localStorage` хранится бессрочно и общий для всех вкладок origin, `sessionStorage` живёт, пока открыта вкладка, и изолирован на неё; оба — синхронные хранилища строк на несколько мегабайт, недоступны серверу. Cookie маленькие (~4 КБ), автоматически отправляются на сервер с каждым запросом, могут быть `HttpOnly` (недоступны JS), `Secure` и `SameSite` — поэтому подходят для сессий. Для больших структурированных данных — IndexedDB.

## Коротко

- Cookies — для сессий: `HttpOnly`, `Secure`, `SameSite`.
- `localStorage`/`sessionStorage` — небольшие настройки; синхронны, доступны любому скрипту.
- IndexedDB — большие и структурированные данные, асинхронно.
- Cache API + Service Worker — офлайн.
- Хранилище может отсутствовать или бросать ошибки — всегда `try/catch`.
