`HttpClient` — HTTP-клиент Angular на Observable. Он типизирует ответы, превращает ошибочные статусы в ошибки потока, поддерживает отмену через отписку, прогресс загрузки и цепочку интерсепторов — middleware для каждого запроса.

## Подключение

```ts
bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withFetch(), // использовать fetch вместо XMLHttpRequest (рекомендуется, обязательно для SSR-стриминга)
      withInterceptors([authInterceptor, errorInterceptor, loggingInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
  ],
});
```

## Запросы

```ts
@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_URL);

  list(params: { page: number; search?: string }) {
    return this.http.get<Paginated<Product>>(`${this.baseUrl}/products`, {
      params: { page: params.page, ...(params.search ? { q: params.search } : {}) },
    });
  }

  create(dto: NewProduct) {
    return this.http.post<Product>(`${this.baseUrl}/products`, dto);
  }

  upload(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post(`${this.baseUrl}/files`, body, { reportProgress: true, observe: 'events' });
  }
}
```

Свойства запроса:

- **Холодный и ленивый**: запрос отправляется при подписке. Нет подписки — нет запроса. Две подписки — два запроса.
- **Отменяемый**: отписка прерывает запрос (это и использует `switchMap`).
- **Завершающийся**: после ответа поток выдаёт значение и `complete` — отписываться вручную не обязательно (но отмена при уходе со страницы полезна).
- Статусы 4xx/5xx и сетевые ошибки приходят как `HttpErrorResponse` в `error`.

`observe: 'response'` вернёт полный `HttpResponse` с заголовками, `observe: 'events'` — поток событий с прогрессом.

> [!NOTE]
> `get<Product>()` не проверяет ответ. Если источнику нельзя полностью доверять, валидируйте данные на границе: схемой в `map()` или опцией `parse` у `httpResource`.

## Функциональные интерсепторы

Интерсептор получает запрос и функцию `next`, вызывающую следующий интерсептор (или бэкенд), и возвращает Observable ответа:

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).accessToken();
  if (!token || !req.url.startsWith(inject(API_URL))) {
    return next(req); // не отправляем токен на чужие домены!
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

Запросы **иммутабельны**: для изменения используйте `req.clone({...})`.

```text
HttpClient.get()
  → authInterceptor → errorInterceptor → loggingInterceptor → HttpBackend (fetch)
  ← ответ проходит цепочку в обратном порядке
```

Это паттерн [Chain of Responsibility](/tracks/patterns/chain-of-responsibility).

### Обработка ошибок

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(Notifications);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          router.navigate(['/login']);
        } else if (error.status >= 500 || error.status === 0) {
          notifications.error('Сервис временно недоступен. Попробуйте позже.');
        }
      }
      return throwError(() => error); // пробросить дальше — вызывающий код решит сам
    }),
  );
};
```

### Повторы с задержкой

```ts
export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  req.method !== 'GET'
    ? next(req) // не повторяем неидемпотентные запросы
    : next(req).pipe(
        retry({
          count: 2,
          delay: (error, attempt) =>
            error instanceof HttpErrorResponse && error.status >= 500 ? timer(attempt * 500) : throwError(() => error),
        }),
      );
```

### Обновление токена при 401

```ts
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/refresh')) {
        // refresh() должен разделять один запрос обновления между параллельными 401 (shareReplay)
        return auth.refresh().pipe(
          switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
        );
      }
      return throwError(() => error);
    }),
  );
};
```

### Контекст запроса

Передать интерсептору флаг из конкретного вызова:

```ts
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

this.http.get('/api/ping', { context: new HttpContext().set(SKIP_LOADER, true) });

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) return next(req);
  const loader = inject(GlobalLoader);
  loader.start();
  return next(req).pipe(finalize(() => loader.stop()));
};
```

### Кеширование

```ts
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  const cache = inject(HttpCache);
  const cached = cache.get(req.urlWithParams);
  if (cached) return of(cached.clone());
  return next(req).pipe(tap((event) => event instanceof HttpResponse && cache.set(req.urlWithParams, event)));
};
```

Для SSR Angular кеширует ответы сам: запросы, выполненные на сервере, передаются в браузер через `TransferState` и не повторяются при гидрации (`withHttpTransferCacheOptions`).

## Порядок интерсепторов

Интерсепторы вызываются в порядке массива для запроса и в обратном — для ответа. Типичный порядок: аутентификация → повторы → обработка ошибок → логирование. Классовые интерсепторы (`HTTP_INTERCEPTORS` + `withInterceptorsFromDi()`) поддерживаются для совместимости.

## Тестирование

```ts
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting()],
});
const api = TestBed.inject(ProductApi);
const http = TestBed.inject(HttpTestingController);

api.list({ page: 1 }).subscribe((page) => expect(page.items.length).toBe(1));

const req = http.expectOne((r) => r.url.endsWith('/products') && r.params.get('page') === '1');
expect(req.request.method).toBe('GET');
req.flush({ items: [product], total: 1 });
http.verify(); // нет неожиданных запросов
```

> [!INTERVIEW]
> «Что такое интерсептор и где вы их применяли?» — Функция-middleware, через которую проходит каждый HTTP-запрос и ответ `HttpClient`. Типичные применения: добавление токена авторизации, обновление токена при 401, глобальная обработка ошибок, повторы для GET при 5xx, индикатор загрузки, кеширование, логирование, добавление заголовков (язык, correlation id). Запрос иммутабелен — изменения через `clone()`.

## Коротко

- `provideHttpClient(withFetch(), withInterceptors([...]))`.
- Запрос холодный: выполняется при подписке, отменяется отпиской.
- Интерсепторы — цепочка функций `(req, next) => Observable`; запрос меняется через `clone`.
- Токен — только на свои домены; повторы — только для идемпотентных запросов.
- Тесты — `provideHttpClientTesting` и `HttpTestingController`.
