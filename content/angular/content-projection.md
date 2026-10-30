Проекция контента позволяет компоненту принимать разметку от родителя и вставлять её в своё оформление — как `children` в React или слоты в Web Components. Это основа гибких UI-библиотек: карточки, модальные окна, табы, таблицы.

## ng-content

```ts
@Component({
  selector: 'app-card',
  template: `
    <article class="card">
      <ng-content />
    </article>
  `,
})
export class Card {}
```

```html
<app-card>
  <h3>Заголовок</h3>
  <p>Любая разметка родителя</p>
</app-card>
```

Проецируемый контент **принадлежит родителю**: он компилируется в шаблоне родителя, его биндинги проверяются вместе с родителем, его компоненты создаются родителем.

## Несколько слотов: select

```ts
@Component({
  selector: 'app-dialog',
  template: `
    <header><ng-content select="[dialog-title]" /></header>
    <section><ng-content /></section>
    <footer><ng-content select="app-dialog-actions, [dialog-actions]" /></footer>
  `,
})
export class Dialog {}
```

```html
<app-dialog>
  <h2 dialog-title>Удалить файл?</h2>
  <p>Действие нельзя отменить.</p>
  <div dialog-actions>
    <button>Отмена</button>
    <button>Удалить</button>
  </div>
</app-dialog>
```

`select` принимает CSS-селекторы: тег, атрибут, класс. Всё, что не подошло под слоты, попадает в `<ng-content />` без `select`. У `ng-content` может быть содержимое по умолчанию (fallback), если ничего не спроецировано:

```html
<ng-content select="[icon]">📄</ng-content>
```

> [!WARNING]
> `<ng-content>` нельзя показать условно или размножить. Контент создаётся родителем **всегда**, даже если `ng-content` находится внутри `@if (false)`: компоненты в нём инициализируются, запросы уходят. Для ленивого или многократного рендера нужен `ng-template`.

## ng-template: отложенный шаблон

`<ng-template>` описывает фрагмент разметки, который не рендерится, пока его явно не создадут.

```html
<ng-template #loadingTpl>
  <app-spinner />
</ng-template>

<ng-container *ngTemplateOutlet="loadingTpl" />
<!-- или -->
<ng-container [ngTemplateOutlet]="loadingTpl" />
```

`<ng-container>` — логическая обёртка, не создающая элемент в DOM.

### Шаблон с контекстом

Компонент может отдать шаблону данные — так строятся настраиваемые списки и таблицы:

```ts
@Component({
  selector: 'app-list',
  imports: [NgTemplateOutlet],
  template: `
    <ul>
      @for (item of items(); track $index) {
        <li>
          <ng-container
            [ngTemplateOutlet]="itemTemplate() ?? defaultTpl"
            [ngTemplateOutletContext]="{ $implicit: item, index: $index }"
          />
        </li>
      }
    </ul>
    <ng-template #defaultTpl let-item>{{ item }}</ng-template>
  `,
})
export class List<T> {
  readonly items = input.required<readonly T[]>();
  readonly itemTemplate = contentChild<TemplateRef<{ $implicit: T; index: number }>>(TemplateRef);
}
```

```html
<app-list [items]="users">
  <ng-template let-user let-i="index">
    <strong>{{ i + 1 }}.</strong> {{ user.name }}
  </ng-template>
</app-list>
```

`let-user` получает `$implicit`, `let-i="index"` — именованное поле контекста.

## Запросы: viewChild и contentChild

- **View** — то, что объявлено в шаблоне самого компонента.
- **Content** — то, что родитель передал между тегами компонента.

```ts
@Component({
  selector: 'app-tabs',
  template: `
    <nav>
      @for (tab of tabs(); track tab) {
        <button (click)="activate(tab)">{{ tab.label() }}</button>
      }
    </nav>
    <div #panel><ng-content /></div>
  `,
})
export class Tabs {
  readonly tabs = contentChildren(Tab); // Signal<readonly Tab[]> — проецированные Tab
  readonly panel = viewChild.required<ElementRef<HTMLDivElement>>('panel'); // из своего шаблона
  readonly firstTab = contentChild(Tab); // Signal<Tab | undefined>
}
```

| Функция | Ищет в | Возвращает |
| --- | --- | --- |
| `viewChild(locator)` | своём шаблоне | `Signal<T \| undefined>` |
| `viewChild.required(locator)` | своём шаблоне | `Signal<T>` |
| `viewChildren(locator)` | своём шаблоне | `Signal<readonly T[]>` |
| `contentChild(locator)` | проецированном контенте | `Signal<T \| undefined>` |
| `contentChildren(locator, { descendants })` | проецированном контенте | `Signal<readonly T[]>` |

`locator` — класс компонента/директивы, `TemplateRef` или строковое имя `#ref`. Опция `read` позволяет получить другой токен с того же элемента: `viewChild('item', { read: ElementRef })`.

Сигнальные запросы обновляются автоматически, их можно использовать в `computed`. Старые декораторы `@ViewChild`, `@ContentChildren` + `QueryList` + хуки `ngAfterViewInit` по-прежнему работают, но новые проще.

> [!NOTE]
> Значение `viewChild` доступно только после того, как view создан. Не читайте его в конструкторе. Для работы с DOM-элементом используйте `afterNextRender` или `effect` — к моменту их выполнения запрос уже заполнен.

## Динамическое создание компонентов

```ts
@Component({
  selector: 'app-widget-host',
  template: `<ng-container #host />`,
})
export class WidgetHost {
  private readonly host = viewChild.required('host', { read: ViewContainerRef });

  async load(type: 'chart' | 'table') {
    const component =
      type === 'chart'
        ? (await import('./chart')).Chart
        : (await import('./table')).Table;
    this.host().clear();
    const ref = this.host().createComponent(component);
    ref.setInput('data', this.data()); // корректно работает с input() и OnPush
  }
}
```

Проще в шаблоне: `<ng-container *ngComponentOutlet="component(); inputs: { data: data() }" />`.

## Коротко

- `<ng-content>` проецирует разметку родителя; `select` создаёт именованные слоты.
- Проецированный контент создаётся родителем всегда — для ленивого рендера используйте `ng-template`.
- `ngTemplateOutlet` с контекстом — настраиваемые шаблоны элементов.
- `viewChild` — свой шаблон, `contentChild` — проекция; сигнальные версии реактивны.
- `ViewContainerRef.createComponent` + `setInput` — динамические компоненты.
