Структура папок — первое, что видит новый разработчик, и первое, что начинает мешать в растущем проекте. Хорошая структура делает очевидным, где искать код, куда добавлять новый и что можно импортировать.

## По типу или по фиче

```text
# По типу файлов — плохо масштабируется
src/app/
  components/   (200 файлов)
  services/
  models/
  pipes/

# По фичам — код, меняющийся вместе, лежит вместе
src/app/
  core/          — синглтоны приложения: layout, auth, интерсепторы, конфиг
  shared/        — переиспользуемое без бизнес-логики: UI-кит, пайпы, утилиты
  features/
    catalog/     — всё о каталоге
    cart/
    checkout/
    profile/
```

Группировка **по фичам** (feature-first) — стандарт Angular-сообщества и рекомендация официального style guide: связанные файлы рядом, фичу можно удалить или вынести в библиотеку целиком.

## Классическая структура Angular-проекта

```text
src/app/
  core/
    layout/            шапка, навигация, оболочка
    auth/              AuthService, guards, interceptors
    error-handling/
  shared/
    ui/                кнопки, модалки, бейджи — presentational, без сервисов данных
    pipes/
    utils/             чистые функции
  features/
    orders/
      data-access/     API-сервисы, стор/фасад, мапперы
      ui/              презентационные компоненты фичи
      feature-list/    smart-страница списка
      feature-details/ smart-страница заказа
      orders.routes.ts
  app.routes.ts
  app.config.ts
```

Правила импорта:

- `features/*` может импортировать `core` и `shared`, но **не другие фичи** напрямую (общее — переносится в `shared` или в отдельную библиотеку).
- `shared` не импортирует `features` и `core`.
- Внутри фичи `ui` не импортирует `data-access`.

Эта платформа устроена так же: `core/` (оболочка, тема, прогресс, поиск), `shared/` (markdown, иконки, утилиты), `domain/` (типы), `content/` (реестр треков, задач, тестов) и `features/` (страницы).

## Feature-Sliced Design (FSD)

FSD — методология, популярная в русскоязычном сообществе (и не только), задающая строгие слои и правила импорта:

```text
app/        инициализация: провайдеры, роутинг, глобальные стили
pages/      страницы — композиция виджетов
widgets/    самостоятельные блоки страницы (шапка, лента, корзина-мини)
features/   пользовательские сценарии с бизнес-ценностью (добавить в корзину, оценить товар)
entities/   бизнес-сущности (product, user, order) — модель, API, базовый UI
shared/     переиспользуемая инфраструктура без бизнес-логики (ui-kit, api-клиент, lib)
```

**Правило**: модуль может импортировать только из слоёв **ниже** себя. `features/add-to-cart` использует `entities/product` и `shared/ui`, но не `widgets` и не другую фичу.

Каждый слой делится на **слайсы** (по бизнес-домену: `product`, `cart`), слайс — на **сегменты** (`ui`, `model`, `api`, `lib`, `config`).

```text
entities/product/
  ui/product-card.ts
  model/product.ts        типы, селекторы
  api/product.api.ts
  index.ts                публичный API слайса
```

### FSD и Angular

FSD родился в React-экосистеме, но применим к Angular: страницы — маршрутизируемые компоненты, `entities` — модели и data-access, `features` — компоненты сценариев с фасадами. Некоторые команды берут идею слоёв и правило импортов, не следуя методологии буквально.

## Публичный API модуля

Каждая фича или слайс экспортирует наружу только то, что должно быть доступно:

```ts
// features/orders/index.ts
export { ORDER_ROUTES } from './orders.routes';
export { OrdersFacade } from './data-access/orders.facade';
export type { Order } from './data-access/order.model';
```

```ts
import { OrdersFacade } from '@app/features/orders'; // ок
import { HttpOrdersApi } from '@app/features/orders/data-access/http-orders.api'; // глубокий импорт — запрещён
```

> [!WARNING]
> Barrel-файлы (`index.ts`) — удобный публичный API, но внутри фичи используйте прямые относительные импорты. Импорт собственного barrel изнутри модуля легко создаёт циклические зависимости.

## Как заставить правила работать

Договорённости без автоматики не живут:

- ESLint: `import/no-restricted-paths`, `eslint-plugin-boundaries` или плагин FSD (`@feature-sliced/steiger`).
- Nx: теги проектов и правило `@nx/enforce-module-boundaries` (см. [Nx: границы модулей](/tracks/tooling/nx-boundaries)).
- Алиасы путей (`@app/features/...`) и запрет глубоких импортов.

> [!INTERVIEW]
> «Как вы структурируете Angular-проект?» — По фичам, а не по типам файлов: `core` для синглтонов приложения, `shared` для переиспользуемого UI и утилит без бизнес-логики, `features` с разделением на data-access, ui и smart-страницы. Фичи не импортируют друг друга напрямую, каждая выставляет публичный API через `index.ts`, а правила импортов проверяет линтер или Nx module boundaries. Для больших проектов подходит FSD с его слоями app/pages/widgets/features/entities/shared.

## Коротко

- Группируйте по фичам: связанный код — рядом.
- `core` — синглтоны, `shared` — без бизнес-логики, `features` — изолированы друг от друга.
- FSD: слои app → pages → widgets → features → entities → shared, импорт только вниз.
- Публичный API через `index.ts`, глубокие импорты запрещены.
- Правила проверяет инструмент, а не память команды.
