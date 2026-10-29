Тесты в Angular-проекте — это прежде всего модульные тесты сервисов и компонентов и, отдельно, end-to-end тесты пользовательских сценариев. С Angular 21 стандартный тест-раннер для новых проектов — **Vitest** (Karma объявлен устаревшим, Jasmine остаётся поддерживаемым вариантом).

## Пирамида тестов

```text
        ▲  E2E (Playwright, Cypress) — мало, медленные, проверяют сценарии целиком
       ▲▲  Интеграционные: компонент + шаблон + дочерние компоненты
     ▲▲▲▲  Модульные: сервисы, пайпы, функции, сторы — много, быстрые
```

## Запуск

```bash
ng test               # Vitest через builder @angular/build:unit-test
ng test --watch=false # для CI
ng test --coverage
```

В этом проекте `ng test` запускает тесты из `*.spec.ts` с окружением jsdom.

## Тестирование чистых функций и сервисов

Логика без зависимостей от Angular тестируется как обычный TypeScript — это самые дешёвые и надёжные тесты:

```ts
describe('formatFileSize', () => {
  it('округляет до одного знака', () => {
    expect(formatFileSize(1536)).toBe('1.5 КБ');
  });
});
```

Сервис с зависимостями — через `TestBed`:

```ts
describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CartStore);
  });

  it('считает общую сумму', () => {
    store.add({ id: '1', title: 'Книга', price: 500 });
    store.add({ id: '1', title: 'Книга', price: 500 });
    expect(store.count()).toBe(2);
    expect(store.total()).toBe(1000);
  });
});
```

### Подмена зависимостей

```ts
TestBed.configureTestingModule({
  providers: [
    { provide: ProductApi, useValue: { list: () => of([{ id: '1', title: 'Книга' }]) } },
    { provide: API_URL, useValue: 'http://test' },
  ],
});
```

> [!TIP]
> Не мокайте то, что можно запустить. Реальный стор или пайп в тесте лучше самописного мока, который со временем разойдётся с оригиналом. Подменяйте границы: сеть (`HttpTestingController`), время (фейковые таймеры), браузерные API.

## HTTP

```ts
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
});

it('загружает товары', async () => {
  const api = TestBed.inject(ProductApi);
  const http = TestBed.inject(HttpTestingController);

  const result = firstValueFrom(api.list({ page: 1 }));
  http.expectOne('/api/products?page=1').flush({ items: [], total: 0 });

  expect(await result).toEqual({ items: [], total: 0 });
  http.verify();
});
```

## Компоненты

```ts
describe('Counter', () => {
  it('увеличивает значение по клику', async () => {
    const fixture = TestBed.createComponent(Counter);
    fixture.componentRef.setInput('step', 2); // корректно для input() и OnPush
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="inc"]');
    button.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('output').textContent).toContain('2');
  });
});
```

- `setInput` — правильный способ задать input (в том числе сигнальный).
- `await fixture.whenStable()` дожидается, пока Angular обработает изменения — работает в zoneless-режиме.
- Ищите элементы по ролям, тексту или `data-testid`, а не по CSS-классам, которые меняются при редизайне.

### Тестирование outputs

```ts
const fixture = TestBed.createComponent(SearchBox);
const emitted: string[] = [];
fixture.componentInstance.search.subscribe((value) => emitted.push(value));
// ... ввод и Enter
expect(emitted).toEqual(['angular']);
```

### Component harnesses

Harness — объект, инкапсулирующий взаимодействие с компонентом (паттерн Page Object). Angular CDK и Material поставляют harness-ы для своих компонентов:

```ts
const loader = TestbedHarnessEnvironment.loader(fixture);
const select = await loader.getHarness(MatSelectHarness.with({ selector: '[formControlName="city"]' }));
await select.open();
await select.clickOptions({ text: 'Казань' });
```

Тесты на harness-ах не ломаются при изменении внутренней разметки библиотеки. Для своих сложных компонентов можно написать свои harness-ы.

## Время и асинхронность

```ts
it('debounce поиска', async () => {
  vi.useFakeTimers();
  const search = TestBed.inject(SearchStore);
  search.setQuery('ang');
  vi.advanceTimersByTime(300);
  await vi.runAllTimersAsync();
  expect(search.lastRequestedQuery()).toBe('ang');
  vi.useRealTimers();
});
```

В zone-проектах используются `fakeAsync` и `tick`. Для RxJS-операторов со временем есть marble-тесты (`TestScheduler`) — см. урок [Marble-тестирование](/tracks/rxjs/testing-marbles).

## Сигналы и эффекты

```ts
it('эффект синхронизирует черновик с хранилищем', () => {
  const storage = TestBed.inject(DraftStorage);
  const editor = TestBed.runInInjectionContext(() => new EditorState());
  editor.text.set('привет');
  TestBed.tick(); // выполнить запланированные эффекты
  expect(storage.read()).toBe('привет');
});
```

## E2E

Playwright или Cypress запускают настоящий браузер и проходят сценарии: вход, оформление заказа, оплату (с тестовым бэкендом). Их мало, но они ловят ошибки интеграции, которые модульные тесты не видят.

```ts
test('пользователь решает задачу', async ({ page }) => {
  await page.goto('/practice/js-debounce');
  await page.getByRole('button', { name: 'Решение' }).click();
  await page.getByRole('button', { name: 'Вставить решение в редактор' }).click();
  await page.getByRole('button', { name: 'Запустить тесты' }).click();
  await expect(page.getByText('Все тесты пройдены')).toBeVisible();
});
```

> [!INTERVIEW]
> «Что и как вы тестируете в Angular?» — Логику — модульными тестами: чистые функции, сервисы и сторы через `TestBed.inject`, HTTP через `HttpTestingController`. Компоненты — через `TestBed.createComponent`, `setInput` и проверку DOM, взаимодействие с библиотечными компонентами — через harness-ы. Критичные сценарии — E2E на Playwright. Подменяю только границы: сеть, время, браузерные API.

## Коротко

- Vitest — стандарт для новых проектов (`ng test`), Karma устарел.
- Логику выносите из компонентов — её проще всего тестировать.
- `TestBed.inject`, `provideHttpClientTesting`, `HttpTestingController`.
- Компоненты: `setInput`, `await fixture.whenStable()`, поиск по ролям и `data-testid`.
- Harness-ы для UI-библиотек, Playwright для сценариев.
