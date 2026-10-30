Чаты, биржевые котировки, уведомления, совместное редактирование, ответы LLM по мере генерации — всё это требует получать данные от сервера без запроса пользователя. Есть три основных подхода: polling, Server-Sent Events и WebSocket.

## Short polling

Клиент периодически спрашивает сервер:

```ts
readonly notifications$ = timer(0, 15_000).pipe(
  exhaustMap(() => this.http.get<Notification[]>('/api/notifications')),
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

Просто, работает везде, легко кешировать и масштабировать. Минусы: задержка до интервала, лишние запросы, когда ничего не изменилось.

## Long polling

Сервер держит запрос открытым, пока не появятся данные (или таймаут), затем клиент сразу отправляет следующий:

```ts
const longPoll$ = defer(() => this.http.get<Event[]>('/api/events?wait=30')).pipe(
  repeat(), // новый запрос сразу после ответа
  retry({ delay: () => timer(2_000) }),
);
```

Почти мгновенная доставка без специальных протоколов, но каждое сообщение — новый HTTP-запрос с заголовками.

## Server-Sent Events (SSE)

Однонаправленный поток **от сервера к клиенту** поверх обычного HTTP:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: price
data: {"symbol":"AAPL","price":231.4}
id: 1042

event: price
data: {"symbol":"AAPL","price":231.6}
id: 1043
```

```ts
function fromEventSource<T>(url: string, eventName: string): Observable<T> {
  return new Observable<T>((subscriber) => {
    const source = new EventSource(url, { withCredentials: true });
    source.addEventListener(eventName, (event) => subscriber.next(JSON.parse(event.data)));
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) subscriber.error(new Error('SSE closed'));
      // при CONNECTING браузер переподключается сам
    };
    return () => source.close();
  });
}
```

Плюсы SSE:

- автоматическое переподключение и `Last-Event-ID` — сервер продолжит с пропущенного события;
- обычный HTTP: работают прокси, авторизация cookie, HTTP/2-мультиплексирование;
- идеально для уведомлений, лент, прогресса задач.

Минусы: только сервер → клиент; `EventSource` не умеет передавать заголовки (`Authorization`), поэтому часто используют `fetch` со стримингом.

### Стриминг через fetch

Ответы LLM обычно приходят именно так — потоковым телом ответа:

```ts
async function* streamCompletion(prompt: string, signal: AbortSignal) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    yield value;
  }
}
```

С `HttpClient` то же самое: `http.post(url, body, { observe: 'events', reportProgress: true, responseType: 'text' })` при `withFetch()` отдаёт частичные ответы `HttpDownloadProgressEvent` с полем `partialText`.

## WebSocket

Полнодуплексный канал поверх одного TCP-соединения: обе стороны могут отправлять сообщения в любой момент.

```ts
import { webSocket } from 'rxjs/webSocket';

@Injectable({ providedIn: 'root' })
export class ChatSocket {
  private readonly socket$ = webSocket<ChatMessage>({
    url: 'wss://chat.example.com/ws',
    openObserver: { next: () => console.info('соединение открыто') },
  });

  readonly messages$ = this.socket$.pipe(
    retry({ delay: (_e, attempt) => timer(Math.min(30_000, 1000 * 2 ** attempt)) }), // переподключение с backoff
    share(),
  );

  send(text: string) {
    this.socket$.next({ type: 'message', text });
  }

  // Подписка на отдельный канал поверх одного соединения
  room(id: string) {
    return this.socket$.multiplex(
      () => ({ type: 'join', room: id }),
      () => ({ type: 'leave', room: id }),
      (msg) => msg.room === id,
    );
  }
}
```

Особенности:

- Нужно самостоятельно решать: переподключение, heartbeat (ping/pong), восстановление пропущенных сообщений, порядок, авторизацию (обычно токен при подключении или первым сообщением).
- Балансировщики и прокси должны поддерживать `Upgrade`; горизонтальное масштабирование требует общей шины (Redis pub/sub, брокер сообщений).
- Браузер не применяет к WebSocket политику CORS — сервер обязан проверять заголовок `Origin` сам, иначе возможна атака Cross-Site WebSocket Hijacking.

## Что выбрать

| Задача | Подход |
| --- | --- |
| Обновление раз в минуту, простая инфраструктура | short polling |
| Уведомления, лента, прогресс, стриминг ответа LLM | SSE / fetch-стриминг |
| Чат, игры, совместное редактирование, двусторонний обмен | WebSocket |
| Очень много данных с низкой задержкой, UDP-подобная доставка | WebTransport (HTTP/3) |

> [!INTERVIEW]
> «Чем SSE отличается от WebSocket?» — SSE — односторонний поток событий от сервера по обычному HTTP с автоматическим переподключением и продолжением с `Last-Event-ID`; хорошо работает с прокси и HTTP/2, подходит для уведомлений и стриминга. WebSocket — двусторонний канал поверх отдельного протокола: подходит для чатов и совместной работы, но переподключение, heartbeat и восстановление сообщений нужно реализовывать самому, а проверку `Origin` — делать на сервере.

## Коротко

- Polling — просто и надёжно, но с задержкой и лишними запросами.
- SSE — односторонний поток по HTTP с автопереподключением.
- fetch-стриминг — для потоковых ответов (LLM) с заголовками и POST.
- WebSocket — двусторонний канал; переподключение и heartbeat — на вас.
- В RxJS: `timer + exhaustMap`, обёртка над `EventSource`, `webSocket` с `retry`.
