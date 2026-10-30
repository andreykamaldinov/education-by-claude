Монорепозиторий без правил быстро превращается в «большой ком грязи»: всё импортирует всё, циклические зависимости, фичи лезут во внутренности друг друга. Nx предлагает типизацию библиотек и автоматическую проверку границ модулей линтером.

## Типы библиотек

Классическая схема Nx для Angular-проектов:

| Тип | Что содержит | Может зависеть от |
| --- | --- | --- |
| **feature** | smart-компоненты, страницы, маршруты фичи | feature (осторожно), ui, data-access, util |
| **ui** | презентационные компоненты, без сервисов данных | ui, util |
| **data-access** | сервисы API, сторы, фасады, модели | data-access, util |
| **util** | чистые функции, типы, константы | util |

```text
feature ──▶ ui ──▶ util
   │               ▲
   └─▶ data-access ┘
```

Это закрепляет [smart/presentational](/tracks/architecture/smart-dumb) и [слоистость](/tracks/architecture/layered-clean) на уровне инструментов: презентационный компонент физически не может импортировать HTTP-сервис.

## Scope: границы доменов

Второе измерение — **область** (домен, команда, приложение):

```text
libs/
  shop/        scope:shop
  admin/       scope:admin
  shared/      scope:shared
```

Правило: `scope:shop` может использовать `scope:shop` и `scope:shared`, но не `scope:admin`. Так bounded contexts из [DDD](/tracks/architecture/ddd) получают техническую защиту.

## Теги и правило линтера

```json
// libs/shop/feature-cart/project.json
{ "tags": ["scope:shop", "type:feature"] }
```

```js
// eslint.config.mjs
export default [
  {
    files: ['**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util'] },
            { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
            { sourceTag: 'scope:shop', onlyDependOnLibsWithTags: ['scope:shop', 'scope:shared'] },
            { sourceTag: 'scope:admin', onlyDependOnLibsWithTags: ['scope:admin', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
          ],
        },
      ],
    },
  },
];
```

Правило также запрещает:

- **глубокие импорты** — только через публичный API библиотеки (`index.ts`);
- **циклические зависимости** между проектами;
- **импорт приложений** из библиотек;
- относительные импорты через границы проектов (`../../libs/...`).

```ts
import { CartFacade } from '@my-shop/shop/data-access-cart'; // ок
import { CartApi } from '@my-shop/shop/data-access-cart/src/lib/cart.api'; // ошибка: deep import
import { AdminUsers } from '@my-shop/admin/feature-users'; // ошибка: scope:shop → scope:admin
```

## Публичный API библиотеки

```ts
// libs/shop/data-access-cart/src/index.ts
export { CartFacade } from './lib/cart.facade';
export type { Cart, CartItem } from './lib/cart.model';
// CartApi, мапперы, внутренние сторы — не экспортируются
```

Всё, что не экспортировано, можно менять свободно — потребители от этого не зависят.

## Как дробить на библиотеки

- Библиотека — единица **границ и кеша**, а не папка ради папки. Мелкие библиотеки ускоряют affected и кеш, но слишком мелкие — увеличивают накладные расходы конфигурации.
- Хорошее начало: по одной `feature`-библиотеке на крупную фичу (или маршрут), `data-access` на домен, общие `ui` и `util`.
- Приложение (`apps/shop`) — тонкое: конфигурация, корневые маршруты, композиция фич.

## Buildable и publishable

- Обычные библиотеки компилируются вместе с приложением.
- **Buildable** — собираются отдельно (инкрементальная сборка больших монорепозиториев).
- **Publishable** — собираются для публикации в npm (ng-packagr).

> [!INTERVIEW]
> «Как не допустить хаоса зависимостей в Nx-монорепозитории?» — Разделить библиотеки по типам (feature, ui, data-access, util) и областям (scope по доменам), отметить их тегами и настроить правило `@nx/enforce-module-boundaries` с `depConstraints`: например, ui зависит только от ui и util, а scope:shop — только от shop и shared. Правило также запрещает глубокие импорты в обход публичного API и циклы. Проверка в CI гарантирует, что архитектура соблюдается автоматически.

## Коротко

- Типы библиотек: feature, ui, data-access, util — с направленными зависимостями.
- Scope-теги разделяют домены и команды.
- `@nx/enforce-module-boundaries` проверяет теги, глубокие импорты и циклы.
- Публичный API — только через `index.ts`.
- Приложение тонкое, логика — в библиотеках.
