Директива добавляет поведение существующему элементу: меняет атрибуты, слушает события, управляет структурой DOM. Компонент — это директива с собственным шаблоном. Директивы — главный способ переиспользовать поведение без наследования.

## Атрибутные директивы

```ts
@Directive({
  selector: '[appAutofocus]',
})
export class Autofocus {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly enabled = input(true, { alias: 'appAutofocus', transform: booleanAttribute });

  constructor() {
    afterNextRender(() => {
      if (this.enabled()) this.element.nativeElement.focus();
    });
  }
}
```

```html
<input appAutofocus />
<input [appAutofocus]="isFirstStep()" />
```

### Host-биндинги

```ts
@Directive({
  selector: '[appTooltip]',
  host: {
    '[attr.aria-describedby]': 'tooltipId',
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class Tooltip {
  readonly text = input.required<string>({ alias: 'appTooltip' });
  protected readonly tooltipId = `tooltip-${nextId++}`;
  show() {}
  hide() {}
}
```

Директива не должна лезть в DOM через `nativeElement.style...`, если можно обойтись host-биндингом: так код работает при SSR и проверяется компилятором. Для прямой работы с DOM используйте `Renderer2`.

## Встроенные атрибутные директивы

- `NgClass`, `NgStyle` — сегодня обычно заменяются на `[class]` и `[style]` биндинги.
- `NgModel` — двусторонняя привязка в template-driven формах.
- `RouterLink`, `RouterLinkActive` — навигация.
- `NgOptimizedImage` (`ngSrc`) — оптимальная загрузка изображений.

## Структурные директивы

Структурная директива управляет тем, сколько раз и создаётся ли шаблон. Звёздочка — сахар:

```html
<p *appIfRole="'admin'">Только для админа</p>

<!-- раскрывается в -->
<ng-template [appIfRole]="'admin'">
  <p>Только для админа</p>
</ng-template>
```

```ts
@Directive({ selector: '[appIfRole]' })
export class IfRole {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly role = input.required<Role>({ alias: 'appIfRole' });

  constructor() {
    effect(() => {
      this.container.clear();
      if (this.auth.roles().includes(this.role())) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
```

- `TemplateRef` — содержимое `ng-template`.
- `ViewContainerRef` — место в DOM, куда можно вставлять view.

На элементе может быть только одна структурная директива (`*ngIf` и `*ngFor` вместе — нельзя). Встроенный control flow `@if`/`@for` снимает эту проблему и работает быстрее, поэтому `NgIf`, `NgFor` и `NgSwitch` объявлены устаревшими. Собственные структурные директивы по-прежнему полезны для доменной логики (роли, фиче-флаги).

### Типизация контекста

```ts
@Directive({ selector: '[appLet]' })
export class Let<T> {
  readonly appLet = input.required<T>();

  static ngTemplateContextGuard<T>(_dir: Let<T>, ctx: unknown): ctx is { $implicit: T; appLet: T } {
    return true;
  }
}
```

Статический `ngTemplateContextGuard` сообщает компилятору тип контекста шаблона — `strictTemplates` будет проверять переменные `let-`.

## Композиция: hostDirectives

Вместо наследования поведение можно собрать из директив прямо в метаданных компонента:

```ts
@Directive({
  selector: '[appFocusRing]',
  host: { '[class.focus-ring]': 'true' },
})
export class FocusRing {}

@Directive({
  selector: '[appPressable]',
  host: { '(pointerdown)': 'pressed.set(true)', '(pointerup)': 'pressed.set(false)' },
})
export class Pressable {
  readonly pressed = signal(false);
  readonly disabled = input(false);
  readonly press = output<void>();
}

@Component({
  selector: 'app-button',
  hostDirectives: [
    FocusRing,
    { directive: Pressable, inputs: ['disabled'], outputs: ['press'] },
  ],
  template: `<ng-content />`,
})
export class Button {
  private readonly pressable = inject(Pressable); // доступ к экземпляру host-директивы
}
```

```html
<app-button [disabled]="saving()" (press)="save()">Сохранить</app-button>
```

- Host-директивы применяются статически, их нельзя включать условно.
- Inputs и outputs host-директивы **не видны** снаружи, пока вы явно не перечислите их в `inputs`/`outputs` (можно с алиасом: `inputs: ['disabled: isDisabled']`).
- Так устроены headless-библиотеки вроде Angular CDK и Angular Aria: поведение (клавиатурная навигация, ARIA-атрибуты) живёт в директивах, внешний вид — в вашем компоненте.

## Селекторы директив

```ts
selector: '[appTooltip]'           // атрибут
selector: 'button[appButton]'      // элемент button с атрибутом
selector: '.highlight'             // класс (редко, неочевидно)
selector: '[appA]:not([disabled])' // с исключением
```

Префикс (`app`, название библиотеки) защищает от конфликтов со стандартными атрибутами и другими библиотеками.

> [!INTERVIEW]
> «Чем директива отличается от компонента?» — Компонент — это директива с шаблоном: он создаёт собственный view и на элементе может быть только один компонент. Директив на элементе может быть сколько угодно, они добавляют поведение к уже существующему элементу или компоненту. Структурные директивы работают с `TemplateRef` и `ViewContainerRef`, чтобы создавать и удалять view.

## Коротко

- Атрибутная директива меняет поведение и вид элемента через host-биндинги.
- Структурная директива управляет созданием view через `TemplateRef` + `ViewContainerRef`.
- Встроенный control flow заменил `NgIf`/`NgFor`/`NgSwitch`.
- `hostDirectives` — композиция поведения вместо наследования.
- `ngTemplateContextGuard` типизирует контекст шаблона.
