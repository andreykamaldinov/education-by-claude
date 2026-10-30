Module Federation (Webpack 5, 2020, Зак Джексон) позволяет одному приложению **во время выполнения** загружать код из другого, независимо собранного и развёрнутого приложения, — и делить с ним общие зависимости. Это техническая основа большинства микрофронтенд-архитектур.

## Основные понятия

| Понятие | Что это |
| --- | --- |
| **Host** (shell) | приложение, которое загружает чужие модули |
| **Remote** | приложение, которое отдаёт (exposes) свои модули |
| **exposes** | какие модули remote делает доступными снаружи |
| **remoteEntry.js** | файл-манифест remote: как получить его модули и какие у него shared-зависимости |
| **shared** | зависимости, которые должны быть общими (Angular, RxJS), чтобы не грузить их дважды |

Одно приложение может быть одновременно host и remote.

## Конфигурация (Webpack)

```js
// remote: catalog/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  output: { publicPath: 'auto', uniqueName: 'catalog' },
  plugins: [
    new ModuleFederationPlugin({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: {
        './Routes': './src/app/catalog.routes.ts',
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true, requiredVersion: '^22.0.0' },
        '@angular/common': { singleton: true, strictVersion: true, requiredVersion: '^22.0.0' },
        '@angular/router': { singleton: true, strictVersion: true, requiredVersion: '^22.0.0' },
        rxjs: { singleton: true, requiredVersion: '^7.8.0' },
      },
    }),
  ],
};
```

```js
// host: shell/webpack.config.js
new ModuleFederationPlugin({
  remotes: {
    catalog: 'catalog@https://catalog.example.com/remoteEntry.js', // статический remote
  },
  shared: { /* те же singleton-зависимости */ },
});
```

```ts
// shell: маршрут к remote
{
  path: 'catalog',
  loadChildren: () => import('catalog/Routes').then((m) => m.CATALOG_ROUTES),
}
```

## Как это работает в рантайме

```text
1. Shell загружается и запрашивает https://catalog.example.com/remoteEntry.js
2. remoteEntry сообщает: «у меня есть ./Routes, мне нужны @angular/core ^22, rxjs ^7.8»
3. Share scope: shell и catalog договариваются о версиях shared-зависимостей —
   используется одна подходящая версия (например, уже загруженная shell-ом)
4. При переходе на /catalog загружаются только чанки модуля ./Routes
```

## Shared-зависимости

```js
shared: {
  '@angular/core': {
    singleton: true, // только один экземпляр на страницу
    strictVersion: true, // ошибка, если версия не удовлетворяет requiredVersion
    requiredVersion: '^22.0.0',
    eager: false, // не включать в начальный чанк
  },
}
```

- **singleton** обязателен для фреймворка: два экземпляра Angular на странице — два разных DI, `NullInjectorError`, неработающий роутер и огромный бандл.
- **strictVersion** — падать при несовместимости вместо тихого использования неподходящей версии.
- Без singleton разные версии библиотеки могут загрузиться параллельно (это нормально для независимых утилит).

## Динамические remotes

Адреса remote-ов лучше не зашивать в сборку — их читают из манифеста при старте:

```ts
// main.ts
fetch('/assets/mf.manifest.json')
  .then((r) => r.json())
  .then((manifest) => setRemoteDefinitions(manifest))
  .then(() => import('./bootstrap'));

// маршрут
loadChildren: () => loadRemoteModule('catalog', './Routes').then((m) => m.CATALOG_ROUTES);
```

Так один и тот же собранный shell работает в разных окружениях (dev, stage, prod), а remote можно перевыкатить без пересборки shell.

> [!NOTE]
> Файл `main.ts` с `import('./bootstrap')` — обязательный трюк: асинхронная граница даёт федерации время договориться о shared-зависимостях до того, как код Angular начнёт выполняться.

## Module Federation и Angular сегодня

- Webpack-вариант для Angular реализован пакетом `@angular-architects/module-federation` с кастомным Webpack-билдером. Он работает только с Webpack-сборкой Angular, которую сам Angular считает устаревшим путём.
- **Module Federation 2.0** (`@module-federation/enhanced`) отделил рантайм от Webpack: есть поддержка Rspack, Vite (через плагины), манифесты, типы для remote-модулей, devtools.
- Для Angular с esbuild-сборкой стандартный путь — **[Native Federation](/tracks/tooling/native-federation)**: та же ментальная модель, но на стандартах браузера.

> [!INTERVIEW]
> «Как работает Module Federation?» — Remote при сборке публикует `remoteEntry.js` с описанием экспортируемых модулей и требуемых shared-зависимостей. Host во время выполнения загружает этот файл, через общий share scope договаривается о версиях зависимостей (singleton для Angular, RxJS) и лениво подгружает нужные модули remote, например маршруты. Это позволяет развёртывать части приложения независимо, не загружая фреймворк дважды.

## Коротко

- Host загружает модули remote во время выполнения через `remoteEntry`.
- `exposes` — что отдаёт remote, `shared` — общие зависимости.
- Angular, RxJS и роутер — `singleton: true, strictVersion: true`.
- Адреса remote-ов — из манифеста при старте (динамическая федерация).
- Для современного Angular на esbuild — Native Federation; MF 2.0 — для Webpack/Rspack.
