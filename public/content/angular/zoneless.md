Zoneless — режим, в котором Angular работает без zone.js. Вместо перехвата всех асинхронных операций фреймворк получает явные уведомления о том, что состояние изменилось. Режим стал стабильным в Angular 20.2 и используется по умолчанию для новых приложений начиная с Angular 21.

## Что сообщает Angular об изменениях

В zoneless-режиме проверку планируют:

| Источник | Пример |
| --- | --- |
| Изменение сигнала, прочитанного в шаблоне | `count.set(1)` |
| `markForCheck()` | в том числе внутри `async` pipe |
| Событие из шаблона или host-слушателя | `(click)`, `host: { '(keydown)': ... }` |
| `ComponentRef.setInput()` | динамические компоненты |
| Присоединение/отсоединение view | `ViewContainerRef.createComponent`, `@if` |
| Регистрация хуков рендеринга | `afterNextRender` |

**Не** сообщают: `setTimeout`, `setInterval`, `Promise.then`, `fetch`, колбэки сторонних библиотек, `subscribe` с присваиванием поля. Если такой код меняет обычное поле — UI не обновится.

## Подключение

```ts
// Angular 21+: новые проекты уже zoneless — ничего делать не нужно.
// Явно (как в этом проекте) или для приложений на Angular 20:
bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
});
```

Затем удалить `zone.js` из `polyfills` в `angular.json` (и `zone.js/testing` из тестов) и сам пакет из зависимостей.

## Планировщик

Когда что-то из списка выше происходит, Angular не запускает проверку немедленно. Он планирует `tick()` так, чтобы объединить несколько изменений в одну проверку: используется ближайшая возможность — гонка между `setTimeout` и `requestAnimationFrame`. Поэтому:

```ts
this.a.set(1);
this.b.set(2);
this.c.set(3);
// одна проверка, а не три
```

## Миграция: что переписать

### Таймеры и сторонние колбэки

```ts
// Было (работало благодаря zone.js)
map.on('moveend', () => (this.bounds = map.getBounds()));

// Стало
protected readonly bounds = signal<Bounds | null>(null);
map.on('moveend', () => this.bounds.set(map.getBounds()));
```

### Подписки

```ts
// Было
this.route.params.subscribe((p) => (this.id = p['id']));

// Стало
readonly id = input.required<string>(); // с withComponentInputBinding()
// или
readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));
```

### NgZone.onStable и onMicrotaskEmpty

Код, ожидающий «стабильности» зоны, чтобы поработать с DOM, заменяется на `afterNextRender`. Код `NgZone.run` / `runOutsideAngular` в zoneless становится просто вызовом функции — его можно оставить, но смысла он больше не несёт.

### Тесты

- `fakeAsync`, `tick`, `flush` требуют zone.js. В zoneless-тестах используйте фейковые таймеры тест-раннера (`vi.useFakeTimers()` в Vitest) и `await fixture.whenStable()`.
- `fixture.detectChanges()` по-прежнему работает, но лучше полагаться на автоматическое обнаружение: `fixture.autoDetectChanges()` или `await fixture.whenStable()`.

> [!TIP]
> Angular CLI MCP-сервер содержит инструмент `onpush_zoneless_migration`, который анализирует код и предлагает план миграции на OnPush и zoneless. Подробнее — в уроке [Angular CLI MCP](/tracks/ai-mcp/angular-cli-mcp).

## SSR и стабильность приложения

При серверном рендеринге Angular должен понять, когда приложение «готово» и HTML можно отдать. С zone.js готовность определялась по отсутствию задач в зоне. В zoneless-режиме готовность определяют **pending tasks**:

```ts
import { PendingTasks } from '@angular/core';

export class ReportService {
  private readonly pendingTasks = inject(PendingTasks);

  generate() {
    // SSR не отдаст HTML, пока промис не завершится
    this.pendingTasks.run(async () => {
      this.report.set(await this.loadReport());
    });
  }
}
```

`HttpClient`, роутер и `resource` уже регистрируют свои задачи сами.

## Плюсы zoneless

- **Производительность**: проверки только по реальным изменениям, нет лишних тиков от сторонних скриптов.
- **Меньше бандл и быстрее старт**: минус zone.js и его инициализация.
- **Нативный async/await**: CLI больше не понижает его до генераторов.
- **Читаемые стеки вызовов** при отладке.
- **Совместимость** с Web Components, микрофронтендами и любыми библиотеками.
- **Явная модель данных**: что меняется — то видно в коде.

> [!INTERVIEW]
> «Как Angular узнаёт об изменениях без zone.js?» — Через явные уведомления: изменение сигнала, прочитанного в шаблоне, `markForCheck()` (его вызывает `async` pipe), события из шаблона и host-слушателей, `setInput` у `ComponentRef`, присоединение view. Планировщик объединяет уведомления и запускает `ApplicationRef.tick()` в ближайшем макрозадаче/кадре. Изменения обычных полей в `setTimeout` или `subscribe` Angular не видит — такой код нужно переводить на сигналы.

## Коротко

- Zoneless: проверку планируют сигналы, события шаблона, `markForCheck`, `setInput`, операции с view.
- По умолчанию с Angular 21; `provideZonelessChangeDetection()` для явного включения.
- Код, полагавшийся на zone.js (поля в таймерах и колбэках), переводится на сигналы.
- В тестах — фейковые таймеры раннера и `whenStable()` вместо `fakeAsync`.
- Для SSR асинхронную работу вне HttpClient оборачивают в `PendingTasks`.
