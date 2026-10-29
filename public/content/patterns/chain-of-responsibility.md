**Chain of Responsibility** передаёт запрос по цепочке обработчиков. Каждый обработчик решает: обработать запрос, изменить и передать дальше или остановить цепочку. Отправитель не знает, кто именно обработает запрос.

## Структура

```ts
type Handler<T, R> = (request: T, next: (request: T) => R) => R;

export function chain<T, R>(handlers: readonly Handler<T, R>[], final: (request: T) => R): (request: T) => R {
  return handlers.reduceRight<(request: T) => R>(
    (next, handler) => (request) => handler(request, next),
    final,
  );
}
```

`reduceRight` собирает цепочку с конца: каждый обработчик получает функцию `next`, вызывающую следующий.

## HTTP-интерсепторы — каноничный пример

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Authorization: `Bearer ${inject(AuthStore).token()}` } }));

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cached = inject(HttpCache).get(req);
  return cached ? of(cached) : next(req); // может прервать цепочку и ответить сам
};

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  return next(req).pipe(finalize(() => console.info(req.url, performance.now() - started)));
};

provideHttpClient(withInterceptors([authInterceptor, cacheInterceptor, loggingInterceptor]));
```

```text
HttpClient → auth → cache ──(есть в кеше)──▶ ответ
                       └─▶ logging → HttpBackend → сервер
```

Каждый интерсептор:

- может изменить запрос (`clone`) и передать дальше;
- может ответить сам и **не вызывать** `next` (кеш, моки);
- может обработать ответ на обратном пути (`pipe` над результатом `next`).

## Middleware

Тот же паттерн — в серверных фреймворках (Express, Koa), в Redux middleware, в NgRx meta-reducers:

```ts
// Express
app.use(cors());
app.use(authenticate);
app.use(rateLimit);
app.get('/api/orders', handler);

// NgRx meta-reducer: логирование каждого action
export function logger(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    console.groupCollapsed(action.type);
    const next = reducer(state, action);
    console.groupEnd();
    return next;
  };
}
```

## Цепочка валидаторов и правил

```ts
type ValidationRule = (password: string) => string | null; // сообщение или null

const rules: ValidationRule[] = [
  (p) => (p.length >= 8 ? null : 'Минимум 8 символов'),
  (p) => (/[A-ZА-Я]/.test(p) ? null : 'Нужна заглавная буква'),
  (p) => (/\d/.test(p) ? null : 'Нужна цифра'),
];

const firstError = (password: string) => rules.map((rule) => rule(password)).find((e) => e !== null) ?? null;
```

Валидаторы форм Angular, guards маршрута (`canActivate: [authGuard, roleGuard]`), обработчики ошибок с разной специализацией — тоже цепочки.

## Обработка ошибок цепочкой

```ts
type ErrorHandlerFn = (error: unknown, next: (error: unknown) => void) => void;

const handlers: ErrorHandlerFn[] = [
  (error, next) => (error instanceof HttpErrorResponse && error.status === 401 ? redirectToLogin() : next(error)),
  (error, next) => (error instanceof ValidationError ? showFieldErrors(error) : next(error)),
  (error) => showToast('Что-то пошло не так'), // обработчик по умолчанию в конце
];
```

## Плюсы и риски

- **Плюсы**: отправитель отвязан от получателей; обработчики добавляются и переставляются без изменения остальных (OCP); каждый решает одну задачу (SRP).
- **Риски**: порядок важен и неочевиден («почему токен не добавился? — интерсептор кеша стоит раньше»); запрос может «провалиться» без обработки, если нет обработчика по умолчанию; отладка длинной цепочки сложнее.

> [!INTERVIEW]
> «Какой паттерн лежит в основе HTTP-интерсепторов?» — Chain of Responsibility: каждый интерсептор получает запрос и функцию `next`, может изменить запрос, обработать ответ на обратном пути или ответить сам, не передавая запрос дальше (например, из кеша). Порядок в `withInterceptors` определяет порядок обработки запроса; ответ проходит цепочку в обратном порядке. Одновременно каждый интерсептор — декоратор вокруг следующего обработчика.

## Коротко

- Chain of Responsibility — запрос идёт по цепочке обработчиков с `next`.
- Обработчик может изменить запрос, обработать ответ или прервать цепочку.
- Интерсепторы Angular, middleware Express/Redux, meta-reducers NgRx — примеры.
- Порядок обработчиков важен; нужен обработчик по умолчанию.
