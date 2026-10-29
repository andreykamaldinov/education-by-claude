Чтобы писать быстрые интерфейсы, нужно понимать, что делает браузер между получением HTML и пикселями на экране. Это знание отвечает на вопросы «почему анимация дёргается», «почему страница прыгает» и «что такое reflow».

## Critical rendering path

```text
HTML ──parse──▶ DOM ─┐
                     ├──▶ Render tree ──▶ Layout ──▶ Paint ──▶ Composite ──▶ экран
CSS ──parse──▶ CSSOM ┘
JS ── может изменить DOM и CSSOM на любом шаге
```

1. **DOM** — дерево узлов из HTML. Парсер работает потоково: начинает строить DOM, не дожидаясь всего файла.
2. **CSSOM** — дерево стилей. CSS **блокирует рендеринг**: браузер не рисует страницу, пока не загрузит и не разберёт CSS из `<head>`, иначе пришлось бы перерисовывать (FOUC).
3. **Render tree** — только видимые узлы с вычисленными стилями (`display: none` не попадает, `visibility: hidden` попадает).
4. **Layout (reflow)** — расчёт геометрии: размеры и позиции каждого блока.
5. **Paint** — заполнение пикселей: текст, цвета, тени, изображения — по слоям.
6. **Composite** — сборка слоёв в итоговое изображение (на GPU).

## Скрипты блокируют парсинг

```html
<script src="app.js"></script> <!-- парсинг HTML останавливается до загрузки и выполнения -->
<script src="app.js" defer></script> <!-- загрузка параллельно, выполнение после парсинга, по порядку -->
<script src="analytics.js" async></script> <!-- загрузка параллельно, выполнение сразу по готовности -->
<script type="module" src="main.js"></script> <!-- ведёт себя как defer -->
```

| Атрибут | Блокирует парсинг | Порядок выполнения | Когда выполняется |
| --- | --- | --- | --- |
| нет | да | по порядку | сразу |
| `defer` | нет | по порядку | после парсинга, до `DOMContentLoaded` |
| `async` | нет (пока грузится) | непредсказуемый | как только загрузился |
| `type="module"` | нет | по порядку | как `defer` |

Angular CLI подключает бандлы как `type="module"`.

## Reflow и repaint

Изменения стилей запускают разные части конвейера:

| Что меняем | Layout | Paint | Composite |
| --- | --- | --- | --- |
| `width`, `height`, `top`, `margin`, `font-size`, текст | да | да | да |
| `color`, `background`, `box-shadow`, `visibility` | нет | да | да |
| `transform`, `opacity` (на отдельном слое) | нет | нет | да |

Поэтому анимируют **только `transform` и `opacity`**: они обрабатываются компоновщиком на GPU, даже если главный поток занят.

```css
/* Плохо: каждый кадр — layout всей страницы */
.panel { transition: left 300ms; }

/* Хорошо: только композиция */
.panel { transition: transform 300ms; }
.panel.open { transform: translateX(0); }
```

## Layout thrashing

Чтение геометрии (`offsetHeight`, `getBoundingClientRect()`, `scrollTop`) заставляет браузер выполнить отложенный layout синхронно. Чередование чтения и записи в цикле вызывает layout на каждой итерации:

```js
// Плохо: N принудительных layout
for (const item of items) {
  const height = item.offsetHeight; // чтение → layout
  item.style.height = `${height * 2}px`; // запись → layout снова невалиден
}

// Хорошо: сначала все чтения, потом все записи
const heights = items.map((item) => item.offsetHeight);
items.forEach((item, i) => (item.style.height = `${heights[i] * 2}px`));
```

В Angular `afterEveryRender`/`afterNextRender` с фазами `earlyRead`, `write`, `mixedRead`, `read` помогают группировать чтения и записи по всем компонентам.

## Слои и will-change

Браузер выносит в отдельный слой элементы с `transform: translateZ(0)`, `will-change: transform`, видео, canvas, фиксированные элементы. Слой можно двигать без перерисовки остального.

```css
.drawer { will-change: transform; } /* подготовить слой заранее */
```

> [!WARNING]
> Не ставьте `will-change` на всё подряд: каждый слой занимает видеопамять. Добавляйте перед анимацией и убирайте после, или только на действительно анимируемые элементы.

## Изоляция работы: contain и content-visibility

```css
.card { contain: layout paint; } /* изменения внутри не влияют на layout снаружи */

.comment { content-visibility: auto; contain-intrinsic-size: auto 200px; }
/* браузер не рендерит содержимое, пока оно не близко к экрану */
```

`content-visibility: auto` может ускорить первый рендер длинных страниц в разы — это «виртуальный скролл» на уровне CSS.

## Кадр и бюджет 16 мс

При 60 Гц у браузера ~16,7 мс на кадр: JS, стили, layout, paint, composite. Если JS выполняется дольше — кадр пропускается, анимация дёргается, ввод «залипает».

```text
| JS (обработчики, rAF) | Стили | Layout | Paint | Composite |  ≤ 16,7 мс
```

Инструменты: Chrome DevTools → Performance (полосы Main, красные метки long tasks), Rendering → Paint flashing и Layout Shift Regions.

## Ресурсные подсказки

```html
<link rel="preconnect" href="https://api.example.com" />   <!-- заранее открыть соединение -->
<link rel="dns-prefetch" href="https://cdn.example.com" />
<link rel="preload" href="/fonts/onest.woff2" as="font" type="font/woff2" crossorigin />
<link rel="modulepreload" href="/chunk-abc.js" />           <!-- заранее загрузить ES-модуль -->
<link rel="prefetch" href="/next-page-chunk.js" />          <!-- низкоприоритетно, на будущее -->
<img src="hero.avif" fetchpriority="high" />                 <!-- приоритет загрузки -->
```

> [!INTERVIEW]
> «Что такое reflow и repaint и как их минимизировать?» — Reflow (layout) — пересчёт геометрии элементов, repaint — перерисовка пикселей без изменения геометрии. Reflow дороже и может затронуть большую часть страницы. Минимизировать: анимировать только `transform` и `opacity`, группировать чтения и записи DOM, избегать чтения геометрии в циклах, изолировать компоненты через `contain`, не менять стили по одному свойству в цикле, использовать `content-visibility` для длинных списков.

## Коротко

- DOM + CSSOM → render tree → layout → paint → composite.
- CSS блокирует рендер, синхронный скрипт — парсинг; используйте `defer`/`module`.
- Layout дороже paint, paint дороже composite — анимируйте `transform`/`opacity`.
- Не чередуйте чтение геометрии и запись стилей (layout thrashing).
- Бюджет кадра — ~16 мс; длинный JS ломает анимации и ввод.
