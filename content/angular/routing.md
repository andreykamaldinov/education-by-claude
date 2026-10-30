Роутер Angular связывает URL с компонентами, управляет историей браузера, ленивой загрузкой кода, доступом к страницам и предзагрузкой данных. Современный роутер полностью функциональный: guards, resolvers и даже провайдеры описываются функциями.

## Конфигурация

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home-page').then((m) => m.HomePage) },
  {
    path: 'products',
    loadChildren: () => import('./products/products.routes').then((m) => m.PRODUCT_ROUTES),
  },
  { path: 'products/:id', component: ProductPage, title: productTitle },
  { path: 'old-catalog', redirectTo: 'products', pathMatch: 'full' },
  { path: '**', component: NotFoundPage },
];

// app.config.ts
provideRouter(
  routes,
  withComponentInputBinding(), // параметры маршрута → input() компонента
  withViewTransitions(), // анимированные переходы через View Transitions API
  withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
  withPreloading(PreloadAllModules),
);
```

Порядок важен: роутер выбирает **первый** подходящий маршрут, поэтому `**` — всегда в конце.

`pathMatch: 'full'` нужен для редиректов с пустого пути: иначе `''` совпадёт с началом любого URL.

## Ленивая загрузка

- `loadComponent` — ленивый компонент страницы.
- `loadChildren` — ленивый набор дочерних маршрутов.

Сборщик выносит каждый `import()` в отдельный чанк, который загружается при первом переходе. Именно так устроена эта платформа: каждая страница — отдельный чанк размером в несколько килобайт.

```ts
// products.routes.ts
export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    providers: [ProductStore], // сервис живёт, пока активна ветка маршрутов
    children: [
      { path: '', component: ProductList },
      { path: ':id', component: ProductDetails },
    ],
  },
];
```

### Стратегии предзагрузки

| Стратегия | Поведение |
| --- | --- |
| `NoPreloading` (по умолчанию) | грузить при переходе |
| `PreloadAllModules` | после старта в фоне загрузить все ленивые маршруты |
| своя `PreloadingStrategy` | например, по флагу `data: { preload: true }` или только на быстрой сети |

Отдельно `@defer` позволяет лениво загружать части **внутри** страницы.

## Параметры маршрута в input()

С `withComponentInputBinding()` параметры пути, query-параметры, `data` и результаты resolvers попадают прямо в inputs:

```ts
// маршрут: products/:id?tab=reviews
export class ProductDetails {
  readonly id = input.required<string>(); // :id
  readonly tab = input<string>(); // ?tab=
  readonly product = input.required<Product>(); // из resolve: { product: ... }

  readonly details = httpResource<Product>(() => `/api/products/${this.id()}`);
}
```

Альтернатива — `ActivatedRoute`:

```ts
const route = inject(ActivatedRoute);
route.paramMap.pipe(map((p) => p.get('id'))); // Observable
route.snapshot.paramMap.get('id'); // разово
```

> [!WARNING]
> `snapshot` не обновится, если роутер переиспользует компонент при переходе `/products/1` → `/products/2` (тот же маршрут — тот же экземпляр). Используйте Observable `paramMap` или `input()`.

## Навигация

```html
<a routerLink="/products">Каталог</a>
<a [routerLink]="['/products', product.id]" [queryParams]="{ tab: 'reviews' }">Отзывы</a>
<a routerLink="/settings" routerLinkActive="active" ariaCurrentWhenActive="page">Настройки</a>
```

```ts
const router = inject(Router);
router.navigate(['/products', id], { queryParams: { tab: 'specs' } });
router.navigateByUrl('/login?returnUrl=%2Fcart');
router.navigate(['..', 'edit'], { relativeTo: inject(ActivatedRoute) });
```

## Guards

Guard решает, можно ли активировать/покинуть маршрут. Возвращает `boolean`, `UrlTree` (редирект), `RedirectCommand` или их Promise/Observable.

```ts
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard =
  (role: Role): CanMatchFn =>
  () =>
    inject(AuthService).hasRole(role);

export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges(): boolean }> = (component) =>
  !component.hasUnsavedChanges() || confirm('Есть несохранённые изменения. Уйти?');
```

```ts
{
  path: 'admin',
  canMatch: [roleGuard('admin')],
  loadChildren: () => import('./admin/admin.routes'),
},
{ path: 'cart', canActivate: [authGuard], component: CartPage },
{ path: 'editor/:id', canDeactivate: [unsavedChangesGuard], component: Editor },
```

| Guard | Когда вызывается |
| --- | --- |
| `canMatch` | при сопоставлении: если `false`, роутер пробует следующие маршруты, а ленивый код **не загружается** |
| `canActivate` | перед активацией маршрута |
| `canActivateChild` | перед активацией дочерних маршрутов |
| `canDeactivate` | перед уходом со страницы |

На этой платформе `canMatch` проверяет, что трек или урок существует: если нет — срабатывает маршрут `**` со страницей 404.

> [!WARNING]
> Guard на клиенте — это UX, а не безопасность. Пользователь может изменить код в браузере. Доступ к данным обязан проверять сервер.

## Resolvers

Загружают данные до активации маршрута:

```ts
export const productResolver: ResolveFn<Product> = (route) =>
  inject(ProductApi).get(route.paramMap.get('id')!);

{ path: 'products/:id', component: ProductDetails, resolve: { product: productResolver } }
```

Минус резолверов — пользователь не видит новую страницу, пока данные не загрузятся. Часто лучше перейти сразу и показать скелетон, загружая данные через `httpResource`. Резолверы уместны для заголовков страниц (`title`), коротких запросов и SSR.

## Заголовок страницы

```ts
{ path: 'profile', component: Profile, title: 'Профиль' },
{ path: 'products/:id', component: ProductDetails, title: productTitleResolver },
```

Своя `TitleStrategy` позволяет добавить суффикс ко всем заголовкам — так сделано на этой платформе («Замыкания — DevShelf»).

## События роутера

```ts
inject(Router)
  .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
  .subscribe((e) => analytics.pageView(e.urlAfterRedirects));
```

Последовательность: `NavigationStart` → `RoutesRecognized` → `GuardsCheckStart/End` → `ResolveStart/End` → `NavigationEnd` (или `NavigationCancel` / `NavigationError`).

> [!INTERVIEW]
> «Чем `canMatch` отличается от `canActivate`?» — `canMatch` участвует в сопоставлении URL: если он вернул `false`, роутер продолжит искать среди других маршрутов, а код ленивого маршрута не будет загружен. `canActivate` вызывается после того, как маршрут уже выбран: при `false` навигация отменяется. Поэтому для ролевого доступа к ленивым разделам удобнее `canMatch`.

## Коротко

- Маршруты сопоставляются по порядку; `**` — последним.
- `loadComponent` / `loadChildren` — ленивые чанки; предзагрузка настраивается стратегией.
- `withComponentInputBinding()` отдаёт параметры прямо в `input()`.
- Функциональные guards: `canMatch`, `canActivate`, `canDeactivate`; возвращают `UrlTree` для редиректа.
- Guards — UX, безопасность обеспечивает сервер.
