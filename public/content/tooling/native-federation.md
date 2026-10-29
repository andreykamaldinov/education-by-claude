Native Federation (Манфред Штайер, Angular Architects) переносит идеи Module Federation на **стандарты браузера**: ES-модули и import maps. Она не зависит от конкретного сборщика и работает с esbuild-сборкой Angular CLI — поэтому стала основным способом строить микрофронтенды на современном Angular.

## Идея: import maps

Браузер умеет сопоставлять «голые» имена модулей с URL:

```html
<script type="importmap">
  {
    "imports": {
      "@angular/core": "/shared/angular-core.js",
      "rxjs": "/shared/rxjs.js"
    },
    "scopes": {
      "https://catalog.example.com/": {
        "lodash-es": "https://catalog.example.com/lodash-es.js"
      }
    }
  }
</script>
```

Native Federation при сборке:

1. собирает shared-зависимости в отдельные ESM-бандлы;
2. генерирует `remoteEntry.json` с описанием exposed-модулей и shared-зависимостей;
3. в рантайме объединяет описания host и remotes, выбирает версии shared-зависимостей и **формирует import map** для браузера.

После этого код remote-а импортирует `@angular/core` и получает тот же экземпляр, что и shell.

## Установка

```bash
npm i -D @angular-architects/native-federation

# remote (микрофронтенд)
ng g @angular-architects/native-federation:init --project catalog --port 4201 --type remote

# shell, читающий адреса remote-ов при старте
ng g @angular-architects/native-federation:init --project shell --port 4200 --type dynamic-host
```

Версия пакета следует версии Angular (мажорная и минорная совпадают). Схематик меняет builder в `angular.json` на builder Native Federation, который оборачивает стандартный esbuild-builder Angular.

## Конфигурация remote

```js
// projects/catalog/federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'catalog',
  exposes: {
    './Routes': './projects/catalog/src/app/catalog.routes.ts',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],
});
```

- `shareAll` — сделать общими все зависимости из `package.json`; `requiredVersion: 'auto'` берёт версии оттуда же.
- `skip` — исключить ненужные точки входа пакетов, чтобы не собирать лишнее.

## Конфигурация shell

```json
// projects/shell/public/federation.manifest.json
{
  "catalog": "https://catalog.example.com/remoteEntry.json",
  "cart": "https://cart.example.com/remoteEntry.json"
}
```

```ts
// projects/shell/src/main.ts
import { initFederation } from '@angular-architects/native-federation';

initFederation('federation.manifest.json')
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap')) // асинхронная граница перед стартом Angular
  .catch((err) => console.error(err));
```

```ts
// projects/shell/src/app/app.routes.ts
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'catalog',
    loadChildren: () => loadRemoteModule('catalog', './Routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'cart',
    loadComponent: () => loadRemoteModule('cart', './CartPage').then((m) => m.CartPage),
  },
];
```

Манифест можно подменять при деплое — один собранный shell работает в любом окружении.

## Module Federation против Native Federation

| | Module Federation (Webpack) | Native Federation |
| --- | --- | --- |
| Основа | рантайм Webpack | ES-модули + import maps |
| Сборщик | Webpack (MF 2.0: также Rspack и др.) | любой; для Angular — esbuild application builder |
| Описание remote | `remoteEntry.js` (код) | `remoteEntry.json` (данные) |
| Angular CLI | только Webpack-сборка (устаревший путь) | стандартная сборка Angular, SSR, incremental hydration |
| Ментальная модель | host, remote, exposes, shared | та же |

Можно комбинировать: shell на Native Federation, загружающий отдельные remote-ы на Module Federation (например, легаси на Webpack) — для этого есть мосты.

## SSR и гидрация

Native Federation поддерживает серверный рендеринг и incremental hydration: на сервере используется тот же механизм import maps для Node.js. Это редкое преимущество — многие микрофронтенд-решения ограничены CSR.

> [!WARNING]
> Federation не решает организационные вопросы за вас: версионирование shared-библиотек, контракты между remote-ами, общая дизайн-система и обработка недоступного remote-а остаются задачами архитектуры. См. [Федерация на практике](/tracks/tooling/federation-in-practice).

> [!INTERVIEW]
> «Чем Native Federation отличается от Module Federation?» — Ментальная модель та же (host, remote, exposes, shared), но Native Federation построена на браузерных стандартах: при сборке shared-зависимости и exposed-модули собираются в ES-модули, а в рантайме формируется import map, по которой браузер разрешает общие зависимости. Поэтому она не привязана к Webpack и работает с esbuild-сборкой Angular CLI, включая SSR, тогда как классическая Module Federation требует рантайма Webpack.

## Коротко

- Native Federation = идеи Module Federation + ES-модули + import maps.
- Работает со стандартной esbuild-сборкой Angular, включая SSR.
- `federation.config.js`: `name`, `exposes`, `shared` (`shareAll` с singleton).
- Shell: `initFederation(manifest)` → `bootstrap`; маршруты — `loadRemoteModule`.
- Манифест remote-ов подменяется при деплое.
