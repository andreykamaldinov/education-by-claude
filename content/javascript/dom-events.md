События — основной способ, которым страница реагирует на пользователя. Даже если Angular скрывает `addEventListener` за `(click)`, понимание фаз события, делегирования и пассивных слушателей нужно для производительности и для отладки «почему клик не срабатывает».

## Три фазы события

Когда пользователь кликает по кнопке внутри списка, событие проходит путь:

```text
window → document → html → body → ul → li → button   (1. capturing, погружение)
                                             button   (2. target, цель)
button → li → ul → body → html → document → window   (3. bubbling, всплытие)
```

По умолчанию слушатели срабатывают на фазе всплытия. Чтобы слушать погружение, передайте `capture: true`:

```js
list.addEventListener('click', handler); // всплытие
list.addEventListener('click', handler, { capture: true }); // погружение
```

- `event.target` — элемент, на котором событие произошло (кнопка).
- `event.currentTarget` — элемент, чей слушатель сейчас выполняется (список).

> [!NOTE]
> Не все события всплывают: `focus`, `blur`, `mouseenter`, `mouseleave`, `load` — нет. Для фокуса есть всплывающие аналоги `focusin` и `focusout`.

## Остановка и отмена

```js
link.addEventListener('click', (event) => {
  event.preventDefault(); // отменить действие браузера (переход по ссылке, отправку формы)
  event.stopPropagation(); // остановить всплытие к родителям
  event.stopImmediatePropagation(); // и не вызывать другие слушатели этого элемента
});
```

`preventDefault` и `stopPropagation` — независимые вещи: первый отменяет поведение браузера, второй — распространение по DOM.

> [!WARNING]
> `stopPropagation` ломает аналитику, закрытие выпадающих меню по клику снаружи и делегирование выше по дереву. Используйте его, только когда точно понимаете последствия.

## Делегирование событий

Вместо сотни слушателей на каждом элементе — один на общем родителе. Работает благодаря всплытию.

```js
const list = document.querySelector('#todo-list');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !list.contains(button)) return;

  const id = button.closest('li').dataset.id;
  if (button.dataset.action === 'delete') removeTodo(id);
  if (button.dataset.action === 'toggle') toggleTodo(id);
});
```

Плюсы: меньше памяти, работает для элементов, добавленных позже, не нужно снимать слушатели при перерисовке строк. Именно так на этой платформе обрабатываются клики по внутренним ссылкам внутри текста урока.

## Параметры addEventListener

```js
element.addEventListener('scroll', onScroll, {
  passive: true, // обещание не вызывать preventDefault — браузер не ждёт обработчик перед прокруткой
  once: true, // автоматически снять после первого срабатывания
  signal: controller.signal, // снять при controller.abort()
  capture: false,
});
```

- **passive** критичен для `touchstart`, `touchmove`, `wheel`: без него браузер вынужден ждать, не отменит ли обработчик прокрутку, и скролл «подтормаживает». Для `touchstart`/`touchmove`/`wheel` на `window`, `document` и `body` Chrome включает passive по умолчанию.
- **signal** — удобный способ снять сразу несколько слушателей:

```js
const controller = new AbortController();
window.addEventListener('resize', onResize, { signal: controller.signal });
window.addEventListener('keydown', onKey, { signal: controller.signal });
// при уничтожении:
controller.abort();
```

## Пользовательские события

```js
const event = new CustomEvent('cart:add', {
  detail: { productId: 42 },
  bubbles: true, // по умолчанию false!
  composed: true, // пересекать границу Shadow DOM
});
button.dispatchEvent(event);

document.addEventListener('cart:add', (e) => console.log(e.detail.productId));
```

`dispatchEvent` выполняет слушателей **синхронно**, в отличие от событий браузера.

## События в Angular

```ts
@Component({
  selector: 'app-dropdown',
  host: {
    '(document:click)': 'closeIfOutside($event)', // глобальный слушатель, Angular снимет его сам
    '(keydown.escape)': 'close()', // псевдособытие с фильтром клавиши
  },
  template: `<button (click)="toggle()">Меню</button>`,
})
export class Dropdown {
  private readonly host = inject(ElementRef);

  closeIfOutside(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target)) this.close();
  }
}
```

- `(click)` в шаблоне — обычный `addEventListener` на элементе, снимаемый при уничтожении view.
- `output()` и `EventEmitter` в Angular **не всплывают** по DOM: это вызов колбэка родителя, а не DOM-событие.
- Каждое событие из шаблона помечает компонент и его предков для проверки (и в OnPush, и в zoneless-режиме). Если слушатель срабатывает очень часто (`mousemove`, `scroll`) и не меняет состояние, вешайте его вручную вне шаблона.

## Порядок событий указателя

Для одного клика мышью: `pointerdown → mousedown → (focus) → pointerup → mouseup → click`. На сенсорных экранах добавляются `touchstart/touchend`. **Pointer Events** (`pointerdown`, `pointermove`) объединяют мышь, перо и касание — используйте их вместо отдельной обработки mouse и touch.

## Коротко

- Событие проходит погружение, цель и всплытие; по умолчанию слушаем всплытие.
- `target` — где произошло, `currentTarget` — где слушаем.
- `preventDefault` отменяет действие браузера, `stopPropagation` — распространение.
- Делегирование: один слушатель на родителе + `closest()`.
- `passive: true` для скролла и касаний, `signal` для массового снятия слушателей.
