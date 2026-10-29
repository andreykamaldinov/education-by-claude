**Command** превращает запрос (действие) в объект. Такой объект можно сохранить, передать, поставить в очередь, залогировать, повторить или отменить. Это основа undo/redo, очередей операций и экшенов в Redux/NgRx.

## Действие как объект

```ts
type Command = {
  readonly label: string;
  execute(): void;
  undo(): void;
};

class AddShapeCommand implements Command {
  readonly label = 'Добавить фигуру';
  constructor(
    private readonly canvas: CanvasModel,
    private readonly shape: Shape,
  ) {}
  execute() { this.canvas.add(this.shape); }
  undo() { this.canvas.remove(this.shape.id); }
}

class MoveShapeCommand implements Command {
  readonly label = 'Переместить';
  constructor(
    private readonly canvas: CanvasModel,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {}
  execute() { this.canvas.move(this.id, this.dx, this.dy); }
  undo() { this.canvas.move(this.id, -this.dx, -this.dy); }
}
```

## История с undo/redo

```ts
@Injectable()
export class CommandHistory {
  private readonly done = signal<readonly Command[]>([]);
  private readonly undone = signal<readonly Command[]>([]);

  readonly canUndo = computed(() => this.done().length > 0);
  readonly canRedo = computed(() => this.undone().length > 0);
  readonly lastLabel = computed(() => this.done().at(-1)?.label);

  execute(command: Command) {
    command.execute();
    this.done.update((list) => [...list, command]);
    this.undone.set([]); // новое действие сбрасывает ветку redo
  }

  undo() {
    const command = this.done().at(-1);
    if (!command) return;
    command.undo();
    this.done.update((list) => list.slice(0, -1));
    this.undone.update((list) => [...list, command]);
  }

  redo() {
    const command = this.undone().at(-1);
    if (!command) return;
    command.execute();
    this.undone.update((list) => list.slice(0, -1));
    this.done.update((list) => [...list, command]);
  }
}
```

```html
<button (click)="history.undo()" [disabled]="!history.canUndo()">Отменить {{ history.lastLabel() }}</button>
```

## Undo через снимки состояния

Альтернатива обратным операциям — хранить снимки иммутабельного состояния (паттерн Memento):

```ts
const past = signal<readonly State[]>([]);
const present = signal<State>(initial);

function apply(next: State) {
  past.update((list) => [...list, present()]);
  present.set(next);
}

function undo() {
  const previous = past().at(-1);
  if (!previous) return;
  past.update((list) => list.slice(0, -1));
  present.set(previous);
}
```

С иммутабельными данными и структурным разделением снимки дешёвые. Реализовать такую историю можно в [практике](/practice/ts-undo-history).

## Command в Redux/NgRx

Action в NgRx — команда (или событие) в виде данных:

```ts
store.dispatch(CartActions.addProduct({ product })); // объект { type: '[Cart] Add Product', product }
```

- Отправитель не знает, кто обработает action (reducer, effects).
- Actions можно логировать, воспроизводить (time-travel в Redux DevTools), сериализовать.
- Reducer — «исполнитель» команды: чистая функция `(state, action) => newState`.

> [!NOTE]
> Хорошая практика NgRx — именовать actions как **события** («[Корзина] Товар добавлен», «[Страница товара] Нажата кнопка "В корзину"»), а не как команды («setCartItems»). Тогда один action может обрабатываться разными частями системы, и в логе видно, что произошло, а не только что изменилось.

## Очереди и офлайн

Команда-объект можно сохранить и выполнить позже:

```ts
type PendingMutation = { id: string; type: 'like' | 'comment'; payload: unknown; createdAt: number };

// офлайн: складываем в IndexedDB; онлайн — отправляем по порядку
online$.pipe(
  filter(Boolean),
  switchMap(() => from(queue.all())),
  concatMap((mutation) => api.send(mutation).pipe(tap(() => queue.remove(mutation.id)))),
);
```

## Command в UI

- Командная палитра (как поиск на этой платформе по `Ctrl K`): список команд с названиями и действиями.
- Горячие клавиши: таблица `сочетание → команда`.
- Пункты меню и кнопки панели инструментов, разделяющие одну команду.

> [!INTERVIEW]
> «Как реализовать undo/redo во фронтенде?» — Два подхода. Command: каждое действие — объект с `execute` и `undo`, история хранит выполненные команды в стеке undo, отменённые — в стеке redo; новое действие очищает redo. Memento/снимки: при иммутабельном состоянии храним массив прошлых состояний и переключаемся между ними; со структурным разделением это дёшево. Во втором подходе проще гарантировать корректность, в первом — меньше памяти и можно отменять действия, затрагивающие внешние системы.

## Коротко

- Command — действие как объект: можно хранить, логировать, отменять, откладывать.
- Undo/redo — два стека команд; новое действие очищает redo.
- Альтернатива — снимки иммутабельного состояния.
- Actions NgRx — команды-данные; лучше именовать их как события.
- Очереди офлайн-операций и командные палитры — тоже Command.
