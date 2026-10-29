import type { Exercise } from '../../domain/exercise.model';

export const RXJS_EXERCISES = [
  {
    id: 'rx-custom-operator',
    trackId: 'rxjs',
    title: 'Свой оператор с нуля',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'observable-basics',
    description: `Реализуйте pipeable-оператор \`mapWithIndex(fn)\` **без** использования операторов RxJS — только через \`new Observable\`:

~~~ts
of('a', 'b').pipe(mapWithIndex((value, index) => value + index)); // 'a0', 'b1'
~~~

Требования:

- пробрасывать \`error\` и \`complete\`;
- при отписке от результата отписываться от источника;
- исключение в \`fn\` превращать в \`error\` потока.

В песочнице RxJS доступен как объект \`rxjs\`.`,
    starter: `const { Observable } = rxjs;

function mapWithIndex<T, R>(fn: (value: T, index: number) => R) {
  return (source: rxjs.Observable<T>) => source;
}
`,
    solution: `const { Observable } = rxjs;

function mapWithIndex<T, R>(fn: (value: T, index: number) => R) {
  return (source: rxjs.Observable<T>) =>
    new Observable<R>((subscriber) => {
      let index = 0;
      const subscription = source.subscribe({
        next(value) {
          let result: R;
          try {
            result = fn(value, index++);
          } catch (error) {
            subscriber.error(error);
            return;
          }
          subscriber.next(result);
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
      return () => subscription.unsubscribe();
    });
}
`,
    tests: [
      { name: 'преобразует значения с индексом', code: `const { of } = rxjs;
expect(await collect(of('a', 'b', 'c').pipe(mapWithIndex((v, i) => v + i)))).toEqual(['a0', 'b1', 'c2']);` },
      { name: 'реализован без встроенных операторов', code: `const { of } = rxjs;
const source = String(mapWithIndex);
expect(source.includes('pipe(')).toBe(false);
expect(await collect(of(1).pipe(mapWithIndex((v) => v * 2)))).toEqual([2]);` },
      { name: 'пробрасывает ошибку источника', code: `const { throwError } = rxjs;
let message = '';
try { await collect(throwError(() => new Error('сбой')).pipe(mapWithIndex((v) => v))); } catch (e) { message = e.message; }
expect(message).toBe('сбой');` },
      { name: 'исключение в fn становится error', code: `const { of } = rxjs;
let message = '';
try { await collect(of(1).pipe(mapWithIndex(() => { throw new Error('плохой проектор'); }))); } catch (e) { message = e.message; }
expect(message).toBe('плохой проектор');` },
      { name: 'отписка доходит до источника', code: `const { interval } = rxjs;
let ticks = 0;
const sub = interval(5).pipe(mapWithIndex(() => ticks++)).subscribe();
await sleep(30);
sub.unsubscribe();
const after = ticks;
await sleep(30);
expect(ticks).toBe(after);` },
    ],
    hints: ['Оператор — функция, принимающая source и возвращающая new Observable.', 'Верните из функции подписки teardown: () => subscription.unsubscribe().'],
  },
  {
    id: 'rx-typeahead',
    trackId: 'rxjs',
    title: 'Поиск с автокомплитом',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'operator-decision-tree',
    description: `Напишите \`createSearch(input$, search, debounceMs)\`. \`input$\` — поток введённых строк, \`search(query)\` — функция, возвращающая Observable результатов.

Требования:

- обрезать пробелы, игнорировать запросы короче 2 символов;
- ждать паузу \`debounceMs\` после ввода;
- не искать повторно ту же строку;
- **отменять** предыдущий запрос, если пришёл новый;
- ошибка поиска не должна ломать поток — вместо результатов отдавать \`[]\`.`,
    starter: `const { debounceTime, distinctUntilChanged, filter, map, switchMap, catchError, of } = rxjs;

function createSearch(
  input$: rxjs.Observable<string>,
  search: (query: string) => rxjs.Observable<string[]>,
  debounceMs: number,
): rxjs.Observable<string[]> {
  return of([]);
}
`,
    solution: `const { debounceTime, distinctUntilChanged, filter, map, switchMap, catchError, of } = rxjs;

function createSearch(
  input$: rxjs.Observable<string>,
  search: (query: string) => rxjs.Observable<string[]>,
  debounceMs: number,
): rxjs.Observable<string[]> {
  return input$.pipe(
    map((query) => query.trim()),
    debounceTime(debounceMs),
    distinctUntilChanged(),
    filter((query) => query.length >= 2),
    switchMap((query) => search(query).pipe(catchError(() => of([])))),
  );
}
`,
    tests: [
      { name: 'debounce: ищет только последнюю строку серии', code: `const { Subject, of } = rxjs;
const input = new Subject();
const calls = spy((q) => of([q]));
const results = [];
createSearch(input, calls, 20).subscribe((r) => results.push(r));
input.next('an'); input.next('ang'); input.next('angu');
await sleep(50);
expect(calls.calls).toEqual([['angu']]);
expect(results).toEqual([['angu']]);` },
      { name: 'короткие и повторные запросы игнорируются', code: `const { Subject, of } = rxjs;
const input = new Subject();
const calls = spy((q) => of([q]));
createSearch(input, calls, 10).subscribe();
input.next('a'); await sleep(25);
input.next(' rx '); await sleep(25);
input.next('rx'); await sleep(25);
expect(calls.calls).toEqual([['rx']]);` },
      { name: 'отменяет предыдущий запрос', code: `const { Subject, timer, map } = rxjs;
const input = new Subject();
const results = [];
const slowSearch = (q) => timer(q === 'first' ? 60 : 5).pipe(map(() => [q]));
createSearch(input, slowSearch, 5).subscribe((r) => results.push(r));
input.next('first');
await sleep(20);
input.next('second');
await sleep(100);
expect(results).toEqual([['second']]);` },
      { name: 'ошибка поиска не ломает поток', code: `const { Subject, throwError, of } = rxjs;
const input = new Subject();
const results = [];
const flaky = (q) => (q === 'bad' ? throwError(() => new Error('500')) : of([q]));
createSearch(input, flaky, 5).subscribe((r) => results.push(r));
input.next('bad'); await sleep(20);
input.next('good'); await sleep(20);
expect(results).toEqual([[], ['good']]);` },
    ],
    hints: [
      'Порядок: map(trim) → debounceTime → distinctUntilChanged → filter → switchMap.',
      'catchError ставьте внутри switchMap — на поток конкретного запроса.',
    ],
  },
  {
    id: 'rx-retry-backoff',
    trackId: 'rxjs',
    title: 'Повтор с экспоненциальной задержкой',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'error-handling',
    description: `Напишите оператор \`retryWithBackoff({ maxRetries, baseMs, shouldRetry })\`:

- при ошибке повторяет подписку на источник не более \`maxRetries\` раз;
- задержка перед попыткой N (с единицы) — \`baseMs * 2^(N-1)\`;
- если \`shouldRetry(error)\` вернул \`false\` — ошибка пробрасывается сразу, без повторов.`,
    starter: `const { retry, timer, throwError } = rxjs;

function retryWithBackoff<T>(options: {
  maxRetries: number;
  baseMs: number;
  shouldRetry?: (error: unknown) => boolean;
}) {
  return (source: rxjs.Observable<T>) => source;
}
`,
    solution: `const { retry, timer, throwError } = rxjs;

function retryWithBackoff<T>(options: {
  maxRetries: number;
  baseMs: number;
  shouldRetry?: (error: unknown) => boolean;
}) {
  const { maxRetries, baseMs, shouldRetry = () => true } = options;
  return (source: rxjs.Observable<T>) =>
    source.pipe(
      retry({
        count: maxRetries,
        delay: (error, attempt) =>
          shouldRetry(error) ? timer(baseMs * 2 ** (attempt - 1)) : throwError(() => error),
      }),
    );
}
`,
    tests: [
      { name: 'успех после нескольких ошибок', code: `const { defer, of, throwError } = rxjs;
let attempts = 0;
const source = defer(() => (++attempts < 3 ? throwError(() => new Error('сбой')) : of('ok')));
expect(await collect(source.pipe(retryWithBackoff({ maxRetries: 5, baseMs: 5 })))).toEqual(['ok']);
expect(attempts).toBe(3);` },
      { name: 'ограничение числа повторов', code: `const { defer, throwError } = rxjs;
let attempts = 0;
const source = defer(() => { attempts++; return throwError(() => new Error('всегда')); });
let message = '';
try { await collect(source.pipe(retryWithBackoff({ maxRetries: 2, baseMs: 1 }))); } catch (e) { message = e.message; }
expect(message).toBe('всегда');
expect(attempts).toBe(3);` },
      { name: 'задержка растёт экспоненциально', code: `const { defer, throwError } = rxjs;
const times = [];
const source = defer(() => { times.push(Date.now()); return throwError(() => new Error('x')); });
try { await collect(source.pipe(retryWithBackoff({ maxRetries: 3, baseMs: 20 }))); } catch {}
const gaps = times.slice(1).map((t, i) => t - times[i]);
expect(gaps[0]).toBeGreaterThan(14);
expect(gaps[1]).toBeGreaterThan(34);
expect(gaps[2]).toBeGreaterThan(74);` },
      { name: 'shouldRetry останавливает повторы', code: `const { defer, throwError } = rxjs;
let attempts = 0;
const source = defer(() => { attempts++; return throwError(() => ({ status: 404 })); });
try { await collect(source.pipe(retryWithBackoff({ maxRetries: 5, baseMs: 1, shouldRetry: (e) => e.status >= 500 }))); } catch {}
expect(attempts).toBe(1);` },
    ],
    hints: ['retry({ count, delay }) — delay получает ошибку и номер попытки (с 1).', 'Чтобы прекратить повторы, верните из delay throwError(() => error).'],
  },
  {
    id: 'rx-exhaust-submit',
    trackId: 'rxjs',
    title: 'Отправка формы без дублей',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'higher-order',
    description: `Пользователь нервно жмёт «Оплатить». Напишите \`submitFlow(clicks$, send)\`: пока запрос \`send()\` выполняется, новые клики игнорируются. Результат — поток ответов сервера.

Подумайте, почему здесь не подходят \`switchMap\` (отменит оплату на клиенте, но не на сервере) и \`mergeMap\` (создаст несколько оплат).`,
    starter: `const { exhaustMap, switchMap, mergeMap, concatMap } = rxjs;

function submitFlow<T>(clicks$: rxjs.Observable<unknown>, send: () => rxjs.Observable<T>): rxjs.Observable<T> {
  return clicks$.pipe(mergeMap(() => send()));
}
`,
    solution: `const { exhaustMap, switchMap, mergeMap, concatMap } = rxjs;

function submitFlow<T>(clicks$: rxjs.Observable<unknown>, send: () => rxjs.Observable<T>): rxjs.Observable<T> {
  return clicks$.pipe(exhaustMap(() => send()));
}
`,
    tests: [
      { name: 'клики во время запроса игнорируются', code: `const { Subject, timer, map } = rxjs;
const clicks = new Subject();
let requests = 0;
const results = [];
submitFlow(clicks, () => { requests++; return timer(30).pipe(map(() => 'оплачено ' + requests)); }).subscribe((r) => results.push(r));
clicks.next(); clicks.next(); clicks.next();
await sleep(50);
expect(requests).toBe(1);
expect(results).toEqual(['оплачено 1']);` },
      { name: 'после завершения можно отправить снова', code: `const { Subject, timer, map } = rxjs;
const clicks = new Subject();
let requests = 0;
submitFlow(clicks, () => { requests++; return timer(10).pipe(map(() => 'ok')); }).subscribe();
clicks.next();
await sleep(30);
clicks.next();
await sleep(30);
expect(requests).toBe(2);` },
    ],
    hints: ['Нужен оператор высшего порядка, который «занят» до завершения внутреннего потока.'],
  },
  {
    id: 'rx-share-cache',
    trackId: 'rxjs',
    title: 'Один запрос на всех подписчиков',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'multicasting',
    description: `Справочник стран грузится по HTTP, а читают его десять компонентов. Напишите \`cached(request$)\`, возвращающую поток, который:

- выполняет запрос **один раз** при первой подписке;
- отдаёт результат всем текущим и **будущим** подписчикам без повторного запроса;
- если запрос упал — следующая подписка повторяет запрос (ошибка не кешируется).`,
    starter: `const { shareReplay, share } = rxjs;

function cached<T>(request$: rxjs.Observable<T>): rxjs.Observable<T> {
  return request$;
}
`,
    solution: `const { shareReplay, share } = rxjs;

function cached<T>(request$: rxjs.Observable<T>): rxjs.Observable<T> {
  return request$.pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
`,
    tests: [
      { name: 'один запрос на несколько подписчиков', code: `const { defer, timer, map } = rxjs;
let requests = 0;
const countries$ = cached(defer(() => { requests++; return timer(10).pipe(map(() => ['RU', 'KZ'])); }));
const [a, b] = await Promise.all([collect(countries$), collect(countries$)]);
expect(a).toEqual([['RU', 'KZ']]);
expect(b).toEqual([['RU', 'KZ']]);
expect(requests).toBe(1);` },
      { name: 'поздний подписчик получает кеш', code: `const { defer, of } = rxjs;
let requests = 0;
const data$ = cached(defer(() => { requests++; return of('данные'); }));
await collect(data$);
await sleep(10);
expect(await collect(data$)).toEqual(['данные']);
expect(requests).toBe(1);` },
      { name: 'ошибка не кешируется', code: `const { defer, of, throwError } = rxjs;
let requests = 0;
const data$ = cached(defer(() => (++requests === 1 ? throwError(() => new Error('сбой')) : of('ok'))));
try { await collect(data$); } catch {}
expect(await collect(data$)).toEqual(['ok']);
expect(requests).toBe(2);` },
    ],
    hints: ['shareReplay с bufferSize: 1.', 'Для конечного справочника refCount: false — осознанный вечный кеш.'],
  },
  {
    id: 'rx-scan-store',
    trackId: 'rxjs',
    title: 'Стор на scan',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'transformation',
    description: `Сделайте мини-стор корзины на RxJS. \`createCartStore()\` возвращает:

- \`dispatch(action)\` — отправка действия;
- \`state$\` — поток состояния, **сразу** отдающий текущее состояние новому подписчику.

Действия: \`{ type: 'add', item: { id, price } }\`, \`{ type: 'remove', id }\`, \`{ type: 'clear' }\`. Повторное добавление того же \`id\` увеличивает \`qty\`.

Состояние: \`{ items: Array<{ id, price, qty }>, total }\`. Обновления — иммутабельные.`,
    starter: `const { Subject, scan, startWith, shareReplay, map } = rxjs;

type Item = { id: string; price: number; qty: number };
type State = { items: Item[]; total: number };
type Action =
  | { type: 'add'; item: { id: string; price: number } }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

function createCartStore() {
  const actions = new Subject<Action>();
  return {
    dispatch: (action: Action) => actions.next(action),
    state$: actions.pipe(map(() => ({ items: [], total: 0 }))),
  };
}
`,
    solution: `const { Subject, scan, startWith, shareReplay, map } = rxjs;

type Item = { id: string; price: number; qty: number };
type State = { items: Item[]; total: number };
type Action =
  | { type: 'add'; item: { id: string; price: number } }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

const initial: State = { items: [], total: 0 };

function reducer(state: State, action: Action): State {
  let items: Item[];
  switch (action.type) {
    case 'add': {
      const existing = state.items.find((i) => i.id === action.item.id);
      items = existing
        ? state.items.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state.items, { ...action.item, qty: 1 }];
      break;
    }
    case 'remove':
      items = state.items.filter((i) => i.id !== action.id);
      break;
    case 'clear':
      items = [];
      break;
  }
  return { items, total: items.reduce((sum, i) => sum + i.price * i.qty, 0) };
}

function createCartStore() {
  const actions = new Subject<Action>();
  const state$ = actions.pipe(scan(reducer, initial), startWith(initial), shareReplay({ bufferSize: 1, refCount: false }));
  state$.subscribe();
  return { dispatch: (action: Action) => actions.next(action), state$ };
}
`,
    tests: [
      { name: 'начальное состояние сразу', code: `const { take } = rxjs;
const store = createCartStore();
expect(await collect(store.state$.pipe(take(1)))).toEqual([{ items: [], total: 0 }]);` },
      { name: 'add, повтор, remove', code: `const { take } = rxjs;
const store = createCartStore();
store.dispatch({ type: 'add', item: { id: 'book', price: 500 } });
store.dispatch({ type: 'add', item: { id: 'book', price: 500 } });
store.dispatch({ type: 'add', item: { id: 'pen', price: 50 } });
store.dispatch({ type: 'remove', id: 'pen' });
const [state] = await collect(store.state$.pipe(take(1)));
expect(state).toEqual({ items: [{ id: 'book', price: 500, qty: 2 }], total: 1000 });` },
      { name: 'clear и иммутабельность', code: `const { take } = rxjs;
const store = createCartStore();
store.dispatch({ type: 'add', item: { id: 'a', price: 1 } });
const [before] = await collect(store.state$.pipe(take(1)));
store.dispatch({ type: 'clear' });
const [after] = await collect(store.state$.pipe(take(1)));
expect(after.items).toEqual([]);
expect(before.items).toHaveLength(1);` },
    ],
    hints: [
      'scan(reducer, initial) накапливает состояние, startWith(initial) даёт начальное значение.',
      'Чтобы поздние подписчики видели текущее состояние, нужен shareReplay и «горячая» подписка.',
    ],
  },
  {
    id: 'rx-combine-vm',
    trackId: 'rxjs',
    title: 'View model из нескольких потоков',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'combination',
    description: `Соберите \`createViewModel(products$, filter$, loading$)\` — поток \`{ visible, count, loading }\`:

- \`visible\` — товары, название которых содержит строку фильтра (без учёта регистра);
- \`count\` — количество видимых;
- поток должен выдать значение **сразу**, даже если \`filter$\` ещё ничего не выдал (фильтр по умолчанию — пустая строка);
- новое значение — при изменении любого источника.`,
    starter: `const { combineLatest, map, startWith } = rxjs;

type Product = { id: number; title: string };

function createViewModel(
  products$: rxjs.Observable<Product[]>,
  filter$: rxjs.Observable<string>,
  loading$: rxjs.Observable<boolean>,
) {
  return combineLatest([products$, filter$, loading$]);
}
`,
    solution: `const { combineLatest, map, startWith } = rxjs;

type Product = { id: number; title: string };

function createViewModel(
  products$: rxjs.Observable<Product[]>,
  filter$: rxjs.Observable<string>,
  loading$: rxjs.Observable<boolean>,
) {
  return combineLatest({ products: products$, filter: filter$.pipe(startWith('')), loading: loading$ }).pipe(
    map(({ products, filter, loading }) => {
      const needle = filter.trim().toLowerCase();
      const visible = products.filter((p) => p.title.toLowerCase().includes(needle));
      return { visible, count: visible.length, loading };
    }),
  );
}
`,
    tests: [
      { name: 'значение без фильтра', code: `const { of, NEVER, concat, take } = rxjs;
const products = of([{ id: 1, title: 'Angular' }, { id: 2, title: 'RxJS' }]);
const vm = await collect(createViewModel(products, NEVER, of(false)).pipe(take(1)));
expect(vm).toEqual([{ visible: [{ id: 1, title: 'Angular' }, { id: 2, title: 'RxJS' }], count: 2, loading: false }]);` },
      { name: 'фильтрация без учёта регистра', code: `const { of, BehaviorSubject, take, skip } = rxjs;
const filter = new BehaviorSubject('');
const values = [];
createViewModel(of([{ id: 1, title: 'Angular' }, { id: 2, title: 'RxJS' }]), filter, of(false)).subscribe((v) => values.push(v));
filter.next('RX');
expect(values.at(-1).count).toBe(1);
expect(values.at(-1).visible[0].title).toBe('RxJS');` },
      { name: 'реагирует на loading', code: `const { of, BehaviorSubject } = rxjs;
const loading = new BehaviorSubject(true);
const values = [];
createViewModel(of([]), of(''), loading).subscribe((v) => values.push(v.loading));
loading.next(false);
expect(values).toEqual([true, false]);` },
    ],
    hints: ['combineLatest молчит, пока каждый источник не выдал значение — добавьте startWith для фильтра.'],
  },
] as const satisfies readonly Exercise[];
