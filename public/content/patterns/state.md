**State** позволяет объекту менять поведение при смене внутреннего состояния — как будто меняется его класс. На практике во фронтенде это **конечные автоматы** (finite state machines): явный список состояний и допустимых переходов вместо россыпи булевых флагов.

## Проблема: флаги

```ts
export class UploadComponent {
  isUploading = false;
  isDone = false;
  hasError = false;
  isPaused = false;
  progress = 0;
}
```

Четыре флага дают 16 комбинаций, большинство из которых бессмысленны: `isUploading && isDone`, `hasError && isPaused`. Каждый обработчик должен помнить, какие флаги сбросить. Баги вида «спиннер крутится после ошибки» — отсюда.

## Состояние как discriminated union

```ts
type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'paused'; progress: number }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string; retryable: boolean };
```

Невозможные комбинации теперь **непредставимы**: у `done` есть `url`, но нет `progress`; у `error` есть сообщение. TypeScript заставит обработать каждое состояние (`switch` + `assertNever`).

## Переходы: конечный автомат

```ts
type UploadEvent =
  | { type: 'START' }
  | { type: 'PROGRESS'; value: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SUCCESS'; url: string }
  | { type: 'FAIL'; message: string }
  | { type: 'RESET' };

export function uploadMachine(state: UploadState, event: UploadEvent): UploadState {
  switch (state.status) {
    case 'idle':
      return event.type === 'START' ? { status: 'uploading', progress: 0 } : state;
    case 'uploading':
      switch (event.type) {
        case 'PROGRESS':
          return { ...state, progress: event.value };
        case 'PAUSE':
          return { status: 'paused', progress: state.progress };
        case 'SUCCESS':
          return { status: 'done', url: event.url };
        case 'FAIL':
          return { status: 'error', message: event.message, retryable: true };
        default:
          return state;
      }
    case 'paused':
      return event.type === 'RESUME' ? { status: 'uploading', progress: state.progress } : state;
    case 'done':
    case 'error':
      return event.type === 'RESET' ? { status: 'idle' } : state;
  }
}
```

Недопустимое событие в текущем состоянии просто игнорируется: нельзя поставить на паузу то, что не загружается. Функция чистая — её легко тестировать таблицей переходов.

```ts
@Component({ /* ... */ })
export class Upload {
  protected readonly state = signal<UploadState>({ status: 'idle' });
  protected send(event: UploadEvent) {
    this.state.update((current) => uploadMachine(current, event));
  }
}
```

```html
@switch (state().status) {
  @case ('idle') { <button (click)="send({ type: 'START' })">Загрузить</button> }
  @case ('uploading') { <progress [value]="$any(state()).progress" max="100"></progress> }
  @case ('done') { <a [href]="$any(state()).url">Готово</a> }
  @case ('error') { <p>{{ $any(state()).message }}</p> }
}
```

> [!TIP]
> Чтобы не писать `$any` в шаблоне, сохраните состояние в переменную с сужением: `@let s = state();` и затем `@if (s.status === 'uploading') { {{ s.progress }} }` — внутри блока тип сужен.

## Классический State с объектами

GoF-вариант — каждое состояние отдельным классом с одинаковым интерфейсом, а контекст делегирует ему:

```ts
type PlayerState = { play(p: Player): void; pause(p: Player): void; label: string };

const Stopped: PlayerState = { label: 'Остановлен', play: (p) => p.setState(Playing), pause: () => {} };
const Playing: PlayerState = { label: 'Играет', play: () => {}, pause: (p) => p.setState(Paused) };
const Paused: PlayerState = { label: 'Пауза', play: (p) => p.setState(Playing), pause: () => {} };

class Player {
  #state: PlayerState = Stopped;
  setState(state: PlayerState) { this.#state = state; }
  play() { this.#state.play(this); }
  pause() { this.#state.pause(this); }
}
```

Во фронтенде чаще используют вариант с данными и редьюсером — он сериализуем и дружит с сигналами и NgRx.

## Где пригодится

- Многошаговые формы и мастера.
- Загрузки, платежи, авторизация (с 2FA, подтверждением, ошибками).
- Медиаплееры, звонки, чат-соединения (connecting → connected → reconnecting).
- Сложные UI-компоненты: комбобокс, drag-and-drop.

Для больших автоматов есть библиотеки (XState) с визуализацией, вложенными и параллельными состояниями.

> [!INTERVIEW]
> «Как избавиться от множества булевых флагов в компоненте?» — Смоделировать состояние как discriminated union, где каждое состояние несёт только свои данные, и описать переходы чистой функцией-редьюсером (конечный автомат). Невозможные комбинации становятся непредставимыми, недопустимые события игнорируются, TypeScript требует обработать каждое состояние, а логику переходов легко тестировать отдельно от UI.

## Коротко

- State — поведение зависит от текущего состояния; во фронтенде — конечные автоматы.
- Флаги дают невозможные комбинации; discriminated union их исключает.
- Переходы — чистая функция `(state, event) => state`.
- Хранится в сигнале или сторе; в шаблоне — `@switch`.
- Strategy выбирают снаружи, State переключается сам.
