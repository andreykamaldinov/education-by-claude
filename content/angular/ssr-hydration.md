Серверный рендеринг (SSR) — генерация HTML страницы на сервере, чтобы пользователь и поисковый робот сразу получили контент, а не пустой `<app-root>`. Гидрация — процесс, в котором Angular в браузере «оживляет» готовый HTML, не пересоздавая DOM.

## CSR, SSR, SSG

| Режим | Как работает | Плюсы | Минусы |
| --- | --- | --- | --- |
| CSR (client-side) | сервер отдаёт пустой HTML и JS, страница рисуется в браузере | просто, дешёвый хостинг | медленный первый экран, хуже SEO |
| SSR | HTML генерируется на сервере для каждого запроса | быстрый первый экран, SEO, превью ссылок | нужен Node.js-сервер, код должен работать вне браузера |
| SSG / prerender | HTML генерируется при сборке | максимальная скорость, статический хостинг | только для страниц, известных заранее |

Angular позволяет смешивать режимы по маршрутам:

```ts
// app.routes.server.ts
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'blog/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => [{ slug: 'angular-22' }] },
  { path: 'cart', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
```

Добавить SSR в проект: `ng add @angular/ssr` (или флаг `--ssr` при создании).

## Как выглядит SSR-запрос

```text
Браузер → GET /products/42
Сервер: запуск приложения Angular в Node.js → роутинг → HTTP-запросы к API → рендер в HTML
       → HTML + сериализованное состояние (TransferState) → браузер
Браузер: показывает HTML сразу (FCP) → загружает JS → гидрация → страница интерактивна
```

## Гидрация

Без гидрации Angular в браузере уничтожил бы серверный DOM и нарисовал его заново — мигание и потраченная работа. С гидрацией он сопоставляет существующие DOM-узлы со своими view и только навешивает слушатели событий.

```ts
bootstrapApplication(App, {
  providers: [
    provideClientHydration(
      withEventReplay(), // запомнить клики до завершения гидрации и воспроизвести их
      withIncrementalHydration(), // гидрация по частям через @defer
      withHttpTransferCacheOptions({ includePostRequests: false }),
    ),
  ],
});
```

### Требования к коду

- **Одинаковый DOM на сервере и клиенте.** Если шаблон рендерит разное (например, `Date.now()` или `Math.random()` прямо в шаблоне), будет ошибка несоответствия гидрации (NG0500).
- **Нельзя менять DOM в обход Angular** до гидрации (прямые манипуляции `innerHTML`, сторонние библиотеки, правящие разметку). Для отдельных компонентов можно отключить гидрацию атрибутом `ngSkipHydration`.
- **Валидный HTML**: браузер исправляет невалидную разметку (например, `<div>` внутри `<p>`), и DOM перестаёт совпадать.

## Incremental hydration

`@defer` получил триггеры гидрации: блок рендерится на сервере (контент виден сразу), а его JS загружается и гидрируется только по условию.

```html
@defer (hydrate on viewport) {
  <app-comments [postId]="post().id" />
} @placeholder {
  <div class="comments-skeleton"></div>
}

@defer (hydrate on interaction) {
  <app-share-panel />
}

@defer (hydrate never) {
  <app-static-footer /> <!-- никогда не гидрировать: чистый HTML -->
}
```

Пользователь сразу видит готовую страницу, а браузер не тратит время на JavaScript невидимых или неинтерактивных частей. Благодаря event replay клик по ещё негидрированной части не теряется.

## Код, который должен работать на сервере

На сервере нет `window`, `document` (кроме серверной реализации), `localStorage`, `IntersectionObserver`.

```ts
export class Chart {
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    // Лучший вариант: хуки рендеринга не выполняются на сервере
    afterNextRender(() => {
      this.chart = new ChartLib(this.canvas().nativeElement);
    });
  }

  saveDraft(text: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('draft', text);
    }
  }
}
```

- Для DOM используйте `inject(DOCUMENT)`, `Renderer2`, host-биндинги — они работают на сервере.
- Браузерные API — в `afterNextRender` или под `isPlatformBrowser`.
- Обёртка над хранилищем с `try/catch` (как в этом проекте) защищает и от SSR, и от приватного режима браузера.

## TransferState и кеш HTTP

Запрос, выполненный при SSR, не должен повторяться в браузере. `HttpClient` с `provideClientHydration` делает это автоматически: ответы GET-запросов сериализуются в HTML и используются при гидрации. Для собственных данных:

```ts
const KEY = makeStateKey<Config>('config');
const state = inject(TransferState);

const cached = state.get(KEY, null);
if (!cached) {
  const config = await loadConfig();
  state.set(KEY, config);
}
```

> [!WARNING]
> Всё, что попало в TransferState, видно в исходном HTML страницы. Не кладите туда токены и персональные данные, которые не должны быть в разметке.

## Метаданные для SEO и превью

```ts
export class ArticlePage {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  constructor() {
    effect(() => {
      const article = this.article.value();
      if (!article) return;
      this.title.setTitle(article.title);
      this.meta.updateTag({ name: 'description', content: article.summary });
      this.meta.updateTag({ property: 'og:image', content: article.cover });
    });
  }
}
```

С SSR эти теги попадают в HTML, и превью ссылок в мессенджерах работают.

> [!INTERVIEW]
> «Что такое гидрация и зачем incremental hydration?» — Гидрация — подключение клиентского Angular к HTML, отрендеренному на сервере: фреймворк переиспользует существующие DOM-узлы, восстанавливает view и навешивает слушатели, вместо того чтобы пересоздавать страницу. Incremental hydration откладывает загрузку и гидрацию частей страницы, обёрнутых в `@defer (hydrate on ...)`, до срабатывания триггера: контент виден сразу, но JS грузится только для нужных частей. Event replay сохраняет действия пользователя до гидрации.

## Коротко

- SSR — быстрый первый экран и SEO; prerender — для статичных страниц; режим задаётся по маршрутам.
- Гидрация переиспользует серверный DOM; DOM должен совпадать на сервере и клиенте.
- `withEventReplay` и `withIncrementalHydration` + `@defer (hydrate on ...)`.
- Браузерные API — в `afterNextRender` или под `isPlatformBrowser`.
- HTTP-ответы переносятся через TransferState; не кладите туда секреты.
