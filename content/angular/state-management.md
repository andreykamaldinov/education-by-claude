Состояние — данные, от которых зависит интерфейс: пользователь, корзина, фильтры, загруженные списки, флаги загрузки. Вопрос «как управлять состоянием» — один из главных архитектурных вопросов в Angular-проекте. Ответ зависит от масштаба: не каждому приложению нужен NgRx.

## Виды состояния

| Вид | Пример | Где жить |
| --- | --- | --- |
| Локальное UI | открыт ли дропдаун | сигнал в компоненте |
| Состояние фичи | фильтры и выбранный элемент таблицы | сервис в `providers` компонента или маршрута |
| Глобальное | текущий пользователь, корзина | сервис `providedIn: 'root'` или глобальный стор |
| Серверное (кеш) | список заказов с сервера | `httpResource`, стор с кешем, TanStack Query |
| URL | страница, сортировка, поиск | роутер (query-параметры) |
| Форма | черновик ввода | формы Angular |

Частая ошибка — тащить всё в глобальный стор. Состояние должно жить на самом низком уровне, где оно нужно.

## Уровень 1: сервис на сигналах

```ts
type CartState = {
  readonly items: readonly CartItem[];
  readonly promoCode: string | null;
};

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly state = signal<CartState>({ items: [], promoCode: null });

  readonly items = computed(() => this.state().items);
  readonly count = computed(() => this.items().reduce((sum, i) => sum + i.qty, 0));
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.qty * i.price, 0));

  add(product: Product) {
    this.state.update((s) => {
      const existing = s.items.find((i) => i.id === product.id);
      const items = existing
        ? s.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...s.items, { id: product.id, price: product.price, qty: 1 }];
      return { ...s, items };
    });
  }

  remove(id: string) {
    this.state.update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  }
}
```

Принципы: состояние приватно, наружу — только чтение (`computed`), изменения — через методы с понятными именами, обновления иммутабельные. Этого достаточно для большинства приложений небольшого и среднего размера.

## Уровень 2: NgRx Store (Redux)

Глобальное хранилище с однонаправленным потоком: **action → reducer → state → selector → компонент**, асинхронщина — в **effects**.

```ts
// actions
export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Product': props<{ product: Product }>(),
    'Checkout': emptyProps(),
    'Checkout Success': props<{ orderId: string }>(),
    'Checkout Failure': props<{ error: string }>(),
  },
});

// reducer — чистая функция (state, action) => newState
export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialState,
    on(CartActions.addProduct, (state, { product }) => ({ ...state, items: [...state.items, toItem(product)] })),
    on(CartActions.checkout, (state) => ({ ...state, status: 'checking-out' as const })),
    on(CartActions.checkoutSuccess, () => initialState),
  ),
  extraSelectors: ({ selectItems }) => ({
    selectTotal: createSelector(selectItems, (items) => items.reduce((s, i) => s + i.price * i.qty, 0)),
  }),
});

// effect — побочные эффекты
export const checkout$ = createEffect(
  (actions$ = inject(Actions), api = inject(OrderApi), store = inject(Store)) =>
    actions$.pipe(
      ofType(CartActions.checkout),
      concatLatestFrom(() => store.select(cartFeature.selectItems)),
      exhaustMap(([, items]) =>
        api.checkout(items).pipe(
          map(({ orderId }) => CartActions.checkoutSuccess({ orderId })),
          catchError((e) => of(CartActions.checkoutFailure({ error: String(e) }))),
        ),
      ),
    ),
  { functional: true },
);

// компонент
export class CartPage {
  private readonly store = inject(Store);
  readonly total = this.store.selectSignal(cartFeature.selectTotal);
  checkout() { this.store.dispatch(CartActions.checkout()); }
}
```

Плюсы: предсказуемость, Redux DevTools с «путешествием во времени», явная история событий, хорошо масштабируется на большие команды. Минусы: много кода, порог входа, косвенность («где обрабатывается этот action?»).

## Уровень 3: NgRx SignalStore

Лёгкий стор на сигналах, собираемый из функций-фич:

```ts
export const TodoStore = signalStore(
  { providedIn: 'root' },
  withState({ todos: [] as Todo[], filter: 'all' as Filter, loading: false }),
  withComputed(({ todos, filter }) => ({
    visible: computed(() => (filter() === 'all' ? todos() : todos().filter((t) => t.done === (filter() === 'done')))),
    remaining: computed(() => todos().filter((t) => !t.done).length),
  })),
  withMethods((store, api = inject(TodoApi)) => ({
    setFilter(filter: Filter) {
      patchState(store, { filter });
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => api.list().pipe(tapResponse({
          next: (todos) => patchState(store, { todos, loading: false }),
          error: () => patchState(store, { loading: false }),
        }))),
      ),
    ),
  })),
  withHooks({ onInit: (store) => store.load() }),
);
```

Фичи можно переиспользовать (`withEntities`, `withRequestStatus`, свои `signalStoreFeature`). SignalStore — частый выбор для новых проектов: структура и расширяемость стора без церемоний Redux.

## Что выбрать

| Ситуация | Рекомендация |
| --- | --- |
| Небольшое приложение, мало общего состояния | сервисы с сигналами |
| Состояние конкретной фичи/страницы | сервис или SignalStore в `providers` маршрута/компонента |
| Много серверных данных, кеш, инвалидация | `httpResource` + сервис, или библиотека серверного кеша |
| Большое приложение, много команд, нужен аудит событий | NgRx Store |
| Средний проект, хочется структуры без boilerplate | NgRx SignalStore |

## Паттерн фасада

Компоненты не должны знать, NgRx у вас или сервис. Фасад скрывает реализацию:

```ts
@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly store = inject(Store);
  readonly total = this.store.selectSignal(cartFeature.selectTotal);
  add(product: Product) { this.store.dispatch(CartActions.addProduct({ product })); }
}
```

Это позволяет мигрировать с одного решения на другое, не трогая компоненты. См. [Facade](/tracks/patterns/facade).

> [!INTERVIEW]
> «Когда нужен NgRx, а когда достаточно сервиса?» — Сервиса с сигналами достаточно, пока состояние понятно локализовано, его немного и им владеет одна команда. NgRx оправдан, когда много общего состояния, сложные асинхронные сценарии, важны трассировка событий и DevTools, над кодом работает много людей и нужен единый строгий паттерн. SignalStore — промежуточный вариант: структура и расширяемость без большого количества шаблонного кода.

## Коротко

- Храните состояние на самом низком нужном уровне; URL и формы — тоже состояние.
- Сервис с приватным `signal`, публичными `computed` и методами — базовый паттерн.
- NgRx Store: actions, reducers, selectors, effects — предсказуемость ценой кода.
- SignalStore: композиция фич на сигналах.
- Фасад отделяет компоненты от выбранной технологии стора.
