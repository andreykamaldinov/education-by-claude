**Composite** (компоновщик) позволяет работать с деревом объектов так же, как с одним объектом. Лист и ветка реализуют общий интерфейс, поэтому клиенту не важно, что перед ним — отдельный элемент или группа.

## Задача

Меню, где пункт может быть ссылкой или подменю с вложенными пунктами; файловая система, где папка содержит файлы и папки; форма, где группа содержит поля и группы. Клиенту нужно, например, посчитать размер, проверить валидность или отрисовать — без бесконечных `if (isFolder)`.

## Реализация

```ts
type FileSystemNode = {
  readonly name: string;
  size(): number;
  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[];
};

class FileNode implements FileSystemNode {
  constructor(
    readonly name: string,
    private readonly bytes: number,
  ) {}

  size() {
    return this.bytes;
  }

  find(predicate: (node: FileSystemNode) => boolean) {
    return predicate(this) ? [this] : [];
  }
}

class FolderNode implements FileSystemNode {
  constructor(
    readonly name: string,
    private readonly children: readonly FileSystemNode[],
  ) {}

  size(): number {
    return this.children.reduce((total, child) => total + child.size(), 0); // рекурсия через общий интерфейс
  }

  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[] {
    const self = predicate(this) ? [this] : [];
    return [...self, ...this.children.flatMap((child) => child.find(predicate))];
  }
}

const project = new FolderNode('src', [
  new FileNode('main.ts', 1_200),
  new FolderNode('app', [new FileNode('app.ts', 3_400), new FileNode('app.css', 800)]),
]);

project.size(); // 5400 — одинаково для файла и папки
```

## Функциональный вариант: рекурсивный тип

Во фронтенде деревья чаще описывают данными, а «композит» — рекурсивными функциями:

```ts
type MenuItem =
  | { readonly kind: 'link'; readonly label: string; readonly url: string }
  | { readonly kind: 'group'; readonly label: string; readonly children: readonly MenuItem[] };

const countLinks = (item: MenuItem): number =>
  item.kind === 'link' ? 1 : item.children.reduce((sum, child) => sum + countLinks(child), 0);

const filterMenu = (item: MenuItem, allowed: (url: string) => boolean): MenuItem | null => {
  if (item.kind === 'link') return allowed(item.url) ? item : null;
  const children = item.children.map((c) => filterMenu(c, allowed)).filter((c): c is MenuItem => c !== null);
  return children.length > 0 ? { ...item, children } : null;
};
```

## Рекурсивный компонент в Angular

```ts
@Component({
  selector: 'app-menu-tree',
  imports: [RouterLink, MenuTree], // компонент импортирует сам себя
  template: `
    <ul>
      @for (item of items(); track item.label) {
        <li>
          @switch (item.kind) {
            @case ('link') {
              <a [routerLink]="item.url">{{ item.label }}</a>
            }
            @case ('group') {
              <details>
                <summary>{{ item.label }}</summary>
                <app-menu-tree [items]="item.children" />
              </details>
            }
          }
        </li>
      }
    </ul>
  `,
})
export class MenuTree {
  readonly items = input.required<readonly MenuItem[]>();
}
```

Альтернатива без рекурсивного компонента — рекурсивный `ng-template`, вызывающий сам себя через `ngTemplateOutlet`.

## Composite в Angular

- **Формы**: `FormGroup` и `FormArray` содержат `AbstractControl`-ы, которые могут быть и полями, и группами. `valid`, `value`, `markAllAsTouched()`, `reset()` работают одинаково на любом уровне — классический компоновщик.
- **Дерево компонентов и view**: change detection обходит дерево, не различая «лист» и «контейнер».
- **Маршруты**: `Route` с `children` — дерево, которое роутер обрабатывает единообразно.
- **Signal Forms**: `FieldTree` повторяет структуру модели, и состояние (`valid`, `errors`) вычисляется рекурсивно.

```ts
const form = new FormGroup({
  name: new FormControl(''),
  address: new FormGroup({ city: new FormControl(''), zip: new FormControl('') }),
});

form.valid; // учитывает все вложенные контролы
form.controls.address.valid; // так же работает для поддерева
```

> [!INTERVIEW]
> «Где в Angular используется паттерн Composite?» — В формах: `FormGroup` и `FormArray` — составные контролы, `FormControl` — лист, все наследуют `AbstractControl`, поэтому валидность, значение, `reset` и `markAllAsTouched` работают одинаково на любом уровне. Также дерево маршрутов с `children` и дерево компонентов, которое обходит change detection.

## Коротко

- Composite — лист и контейнер с общим интерфейсом, клиент не различает их.
- Операции над деревом реализуются рекурсией через общий интерфейс.
- Во фронтенде — рекурсивные типы (discriminated union) и функции.
- Рекурсивный компонент импортирует сам себя.
- `FormGroup`/`FormArray`/`FormControl` — компоновщик в Angular.
