Nx — платформа для монорепозиториев, которая знает структуру вашего кода: какие проекты есть, кто от кого зависит и какие задачи нужно выполнить. На этом знании построены главные возможности: выполнение только затронутых задач, кеширование результатов и генерация кода.

## Структура workspace

```text
my-shop/
  apps/
    shop/                 Angular-приложение
    admin/                Angular-приложение
    api/                  NestJS
    shop-e2e/             Playwright
  libs/
    shop/
      feature-catalog/
      feature-cart/
      data-access-products/
      ui-product-card/
    shared/
      ui/                 дизайн-система
      util-formatting/
  nx.json                 настройки Nx: кеш, targetDefaults, плагины
  package.json            единые зависимости
  tsconfig.base.json      алиасы библиотек (@my-shop/shop/feature-cart)
```

Каждый проект описывается `project.json` (или выводится плагинами из конфигурации инструментов — inferred tasks):

```json
{
  "name": "shop-feature-cart",
  "sourceRoot": "libs/shop/feature-cart/src",
  "tags": ["scope:shop", "type:feature"],
  "targets": {
    "test": { "executor": "@nx/vite:test" },
    "lint": { "executor": "@nx/eslint:lint" }
  }
}
```

## Граф проектов

Nx анализирует импорты TypeScript и `package.json` и строит граф зависимостей между проектами:

```bash
nx graph           # интерактивная визуализация в браузере
nx show project shop-feature-cart
```

```text
apps/shop ──▶ feature-catalog ──▶ data-access-products ──▶ shared/util-formatting
          └─▶ feature-cart ─────▶ ui-product-card ──────▶ shared/ui
```

Граф — основа всего остального.

## Запуск задач

```bash
nx serve shop
nx build shop
nx test shop-feature-cart
nx run-many -t lint test build          # для всех проектов
nx run-many -t test -p shop admin       # для выбранных
```

Задачи можно связывать: сборка приложения сначала собирает зависимые библиотеки (`dependsOn: ["^build"]`).

## Affected: только то, что затронуто

```bash
nx affected -t lint test build --base=origin/main --head=HEAD
```

Nx сравнивает изменённые файлы с базовой веткой, находит проекты, которым принадлежат эти файлы, и всех, кто от них **зависит** (по графу). Изменили `shared/util-formatting` — протестируются он и все потребители. Изменили только `apps/admin` — `shop` не трогается.

На больших монорепозиториях это сокращает CI с часа до минут.

## Кеш вычислений

Nx хеширует **входы** задачи (исходники проекта и зависимостей, конфиги, версии зависимостей, переменные окружения, команду) и сохраняет **выходы** (файлы в `dist`, вывод терминала). Если хеш совпал — результат восстанавливается мгновенно, задача не выполняется.

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "outputs": ["{options.outputPath}"],
      "cache": true
    },
    "test": { "inputs": ["default", "^production"], "cache": true }
  },
  "namedInputs": {
    "production": ["default", "!{projectRoot}/**/*.spec.ts"]
  }
}
```

`namedInputs` уточняет, что влияет на результат: изменение теста не инвалидирует кеш сборки.

### Удалённый кеш

Кеш можно разделять между разработчиками и CI (Nx Cloud или самостоятельно размещённые варианты). Задача, собранная в CI, мгновенно «собирается» у разработчика при том же хеше. Плюс **распределённое выполнение** — Nx раскидывает задачи по нескольким агентам CI.

> [!WARNING]
> Кеш корректен, только если входы описаны полностью. Если сборка зависит от переменной окружения, не указанной во `inputs`, Nx может отдать результат из кеша, собранный с другим значением. Описывайте `inputs` для env и внешних файлов.

## Генераторы

```bash
nx g @nx/angular:application apps/admin
nx g @nx/angular:library libs/shop/feature-orders --tags=scope:shop,type:feature
nx g @nx/angular:component libs/shop/ui-product-card/src/lib/price-tag
nx g @nx/angular:host apps/shell --remotes=catalog,cart   # микрофронтенды
```

Генераторы создают проекты и код по стандартам команды. Можно писать свои (локальные плагины) — например, «фича» сразу с data-access, ui и маршрутами.

## Миграции

```bash
nx migrate latest
npm install
nx migrate --run-migrations
```

Nx обновляет свои пакеты и Angular вместе и выполняет миграции кода (аналог `ng update`, но для всего монорепозитория).

## Nx и Angular CLI

- Nx-проекты используют те же builders Angular (через executors `@nx/angular` или напрямую `@angular/build`).
- Существующий Angular CLI-проект превращается в Nx-workspace командой `npx nx@latest init`.
- Nx не требует отказа от Angular CLI-знаний: `angular.json` → `project.json`, builders → executors.

> [!INTERVIEW]
> «Как Nx ускоряет CI?» — Тремя механизмами. Affected: по git-диффу и графу проектов запускаются задачи только для изменённых проектов и их зависимых. Кеш вычислений: задачи с теми же хешами входов не выполняются, а восстанавливают сохранённые выходы, в том числе из удалённого кеша, общего для CI и разработчиков. Распределённое выполнение: задачи раскидываются по нескольким агентам с учётом графа.

## Коротко

- Nx строит граф проектов из импортов и использует его везде.
- `nx affected` — только затронутые проекты и их зависимые.
- Кеш по хешу входов, локальный и удалённый; точно описывайте `inputs`.
- Генераторы и миграции поддерживают единые стандарты.
- Executors Nx используют те же builders Angular.
