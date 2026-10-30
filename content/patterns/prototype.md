**Prototype** создаёт новые объекты копированием существующего образца вместо построения с нуля. Это полезно, когда создание дорогое или когда нужен объект «как этот, но с парой отличий».

## Идея

```ts
type Shape = {
  clone(): Shape;
};

class Circle implements Shape {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public style: { fill: string; stroke: string },
  ) {}

  clone(): Circle {
    return new Circle(this.x, this.y, this.radius, { ...this.style }); // вложенный объект — тоже копия
  }
}

const template = new Circle(0, 0, 10, { fill: '#2450b8', stroke: 'none' });
const copy = template.clone();
copy.x = 100; // template не изменился
```

Клиенту не нужно знать класс объекта и параметры его конструктора — достаточно метода `clone()`.

## В JavaScript паттерн встроен в язык

Прототипное наследование JavaScript — это буквально «создать объект на основе образца»:

```ts
const defaults = { theme: 'light', fontSize: 16, notifications: true };
const settings = Object.create(defaults); // новый объект с прототипом-образцом
settings.theme = 'dark';
```

Подробнее — урок [Прототипы и наследование](/tracks/javascript/prototypes).

## Копирование данных

На практике во фронтенде «прототип» чаще всего — копирование состояния:

```ts
// Поверхностная копия с изменениями — основа иммутабельных обновлений
const next = { ...state, filter: 'done' };

// Глубокая копия
const draft = structuredClone(savedDocument);
```

| Способ | Глубина | Ограничения |
| --- | --- | --- |
| `{ ...obj }`, `[...arr]` | один уровень | вложенные объекты общие |
| `structuredClone(obj)` | полная | нет функций, классы теряют прототип |
| `JSON.parse(JSON.stringify(obj))` | полная | теряет `Date`, `Map`, `undefined`, падает на циклах |
| свой `clone()` | любая | нужно поддерживать при изменении класса |

## Практические сценарии

### Черновик редактирования

```ts
export class ProfileEditor {
  readonly profile = input.required<Profile>();
  // Пользователь редактирует копию; оригинал не меняется до сохранения
  protected readonly draft = linkedSignal(() => structuredClone(this.profile()));

  protected reset() {
    this.draft.set(structuredClone(this.profile()));
  }
}
```

### «Дублировать» в интерфейсе

```ts
duplicateWidget(widget: Widget) {
  const copy: Widget = { ...structuredClone(widget), id: crypto.randomUUID(), title: `${widget.title} (копия)` };
  this.widgets.update((list) => [...list, copy]);
}
```

### Шаблоны конфигураций

```ts
const BASE_CHART: ChartConfig = { type: 'line', legend: true, animation: { duration: 300 } };
const salesChart = { ...structuredClone(BASE_CHART), title: 'Продажи' };
```

> [!WARNING]
> Поверхностная копия с вложенными объектами — частый источник багов: «я изменил копию, а поменялся оригинал». Если структура вложенная, обновляйте каждый уровень явно или используйте `structuredClone`/Immer.

> [!INTERVIEW]
> «Как глубоко скопировать объект в JavaScript?» — `structuredClone(obj)`: поддерживает вложенность, `Date`, `Map`, `Set`, циклические ссылки, но не копирует функции и теряет прототипы классов. `JSON.parse(JSON.stringify())` теряет `undefined`, функции, превращает `Date` в строку и падает на циклах. Spread и `Object.assign` копируют только первый уровень. Для экземпляров классов — собственный метод `clone()`.

## Коротко

- Prototype — создание объектов копированием образца.
- В JavaScript идея встроена в язык (`Object.create`, цепочка прототипов).
- Во фронтенде — прежде всего копирование состояния: spread, `structuredClone`.
- Черновики, дублирование, шаблоны конфигураций — типичные сценарии.
- Помните о поверхностности spread.
