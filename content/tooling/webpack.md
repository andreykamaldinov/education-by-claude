Webpack (2012) — сборщик, определивший фронтенд-разработку на десятилетие. Его концепция «всё — модуль» (JS, CSS, картинки, шрифты) и экосистема loaders и plugins сделали его стандартом. Angular CLI до версии 17 по умолчанию собирал проекты именно им, и множество проектов на нём живут до сих пор.

## Ключевые понятия

```js
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production', // development | production — набор оптимизаций по умолчанию
  entry: { main: './src/main.ts' }, // точки входа
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js', // хеш содержимого для кеширования
    clean: true,
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.scss$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] },
      { test: /\.(png|svg|woff2)$/, type: 'asset' }, // asset modules
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' }), new MiniCssExtractPlugin()],
  optimization: {
    splitChunks: { chunks: 'all' }, // выделение общих и vendor-чанков
    runtimeChunk: 'single',
  },
  devtool: 'source-map',
};
```

| Понятие | Что делает |
| --- | --- |
| **entry** | откуда начинать граф |
| **output** | куда и как называть результат |
| **loaders** | преобразуют **отдельный файл** в модуль (TS → JS, SCSS → CSS) |
| **plugins** | работают со **всей компиляцией**: генерируют HTML, извлекают CSS, минифицируют, определяют константы |
| **mode** | пресеты оптимизаций |
| **chunks** | части итогового бандла |

### Loaders выполняются справа налево

```js
use: ['style-loader', 'css-loader', 'sass-loader'];
// sass-loader: SCSS → CSS → css-loader: CSS → JS-модуль → style-loader: вставить <style> в DOM
```

## Как работает Webpack

1. Начиная с entry, рекурсивно разбирает файлы, прогоняя каждый через подходящие loaders.
2. Строит граф модулей и группирует их в чанки.
3. Плагины на хуках компиляции (tapable) модифицируют процесс.
4. Генерирует бандлы с **рантаймом Webpack** — небольшим кодом, который реализует `__webpack_require__`, загрузку чанков и кеш модулей.

```js
// Упрощённо, что лежит в бандле
const modules = {
  './src/main.ts': (module, exports, require) => {
    const app = require('./src/app.ts');
  },
  './src/app.ts': (module, exports) => { /* ... */ },
};
```

## Dev-сервер и HMR

`webpack-dev-server` собирает проект в память и обновляет изменённые модули через HMR. Чем больше проект, тем дольше: при изменении файла Webpack пересобирает затронутые чанки.

## Почему Webpack медленный на больших проектах

- Написан на JavaScript: однопоточная работа с огромным графом.
- Каждый файл проходит цепочку loaders (часто тоже на JS: `babel-loader`, `ts-loader`).
- В режиме разработки всё равно собирается бандл.
- Сложная модель плагинов с множеством хуков.

Ускорители: `thread-loader`, кеш на диске (`cache: { type: 'filesystem' }`), замена `babel-loader` на `esbuild-loader` или `swc-loader`. Но фундаментально Rust/Go-инструменты быстрее в разы — отсюда появление **Rspack**: Rust-реализация, совместимая с API и большинством плагинов Webpack.

## Module Federation

Главная «уникальная» возможность Webpack 5 — загрузка модулей из **другого независимо собранного приложения** во время выполнения. Основа микрофронтендов: [Module Federation](/tracks/tooling/module-federation).

## Webpack в Angular

- До Angular 17 builder `@angular-devkit/build-angular:browser` использовал Webpack под капотом с собственной конфигурацией. Пользователь видел только `angular.json`.
- Для расширения использовали `@angular-builders/custom-webpack` — например, для Module Federation (`@angular-architects/module-federation`).
- Builder на Webpack ещё доступен для совместимости, но новые проекты используют esbuild-builder `@angular/build:application`, и миграция на него — рекомендуемый путь ([почему](/tracks/tooling/angular-builders)).

> [!INTERVIEW]
> «Чем loader отличается от plugin в Webpack?» — Loader преобразует отдельный файл при импорте: TypeScript в JavaScript, SCSS в CSS, картинку в URL; цепочка loaders применяется справа налево. Plugin подключается к хукам всей компиляции и может делать что угодно на уровне сборки: генерировать HTML, извлекать CSS в файлы, минифицировать, задавать константы, анализировать бандл.

## Коротко

- Webpack: entry → граф модулей → loaders → plugins → чанки с рантаймом.
- Loaders — трансформация файлов, plugins — вмешательство в компиляцию.
- `splitChunks`, `contenthash`, filesystem-кеш — основные оптимизации.
- Медленный на больших проектах из-за JS-реализации и бандлинга в dev.
- Module Federation — ключевая возможность Webpack 5; Rspack — быстрая совместимая альтернатива.
