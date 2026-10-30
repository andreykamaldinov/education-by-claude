**Mediator** (посредник) убирает прямые связи между компонентами: вместо того чтобы общаться друг с другом, они общаются через посредника. Связи «каждый с каждым» превращаются в «каждый с посредником».

## Проблема

Страница поиска авиабилетов: фильтр дат, фильтр пересадок, сортировка, список результатов, карта, счётчик найденного. Если каждый компонент напрямую оповещает остальные, получается паутина: при N компонентах — до N×(N−1) связей, и добавление одного виджета требует правок в нескольких местах.

```text
Без посредника:              С посредником:
 A ── B                       A   B
 │ ╲╱ │                        ╲ ╱
 │ ╱╲ │                     Mediator
 C ── D                        ╱ ╲
                              C   D
```

## Посредник в Angular: сервис фичи

```ts
type Filters = { dates: DateRange | null; maxStops: number; sort: SortId };

@Injectable()
export class FlightSearchMediator {
  private readonly api = inject(FlightsApi);

  readonly filters = signal<Filters>({ dates: null, maxStops: 2, sort: 'price' });
  readonly selectedFlightId = signal<string | null>(null);

  readonly results = rxResource({
    params: () => this.filters(),
    stream: ({ params }) => this.api.search(params),
  });

  readonly count = computed(() => this.results.value()?.length ?? 0);

  setDates(dates: DateRange) {
    this.filters.update((f) => ({ ...f, dates }));
    this.selectedFlightId.set(null); // правило координации живёт в одном месте
  }

  setMaxStops(maxStops: number) {
    this.filters.update((f) => ({ ...f, maxStops }));
  }

  select(id: string) {
    this.selectedFlightId.set(id); // и список, и карта отреагируют
  }
}

@Component({
  selector: 'app-flight-search-page',
  providers: [FlightSearchMediator], // свой экземпляр на страницу
  template: `
    <app-date-filter />
    <app-stops-filter />
    <app-results-list />
    <app-route-map />
  `,
})
export class FlightSearchPage {}

@Component({ selector: 'app-route-map', template: `...` })
export class RouteMap {
  private readonly mediator = inject(FlightSearchMediator);
  protected readonly selected = computed(() =>
    this.mediator.results.value()?.find((f) => f.id === this.mediator.selectedFlightId()),
  );
}
```

Компоненты знают только посредника. Новый виджет (например, график цен) подключается к нему, не трогая остальных.

## Mediator и родительский компонент

Простейший посредник — **общий родитель**: дети сообщают ему через outputs, он раздаёт данные через inputs. Это хорошо работает для двух-трёх компонентов рядом. Когда цепочки «наверх-вниз» становятся длинными (prop drilling), выносите координацию в сервис-посредник.

## Mediator, Observer, Facade

| Паттерн | Суть |
| --- | --- |
| Observer | подписчики получают уведомления от субъекта |
| Mediator | объекты общаются **через** посредника, который содержит логику координации |
| Facade | упрощённый вход в подсистему для внешнего клиента; подсистема о фасаде не знает |

Посредник часто реализуется через Observer (сигналы, Subject), а снаружи может выглядеть как фасад.

## Риски

- **Божественный объект**: посредник, который знает обо всём приложении. Делайте посредника на фичу или страницу, а не глобальный.
- **Шина событий без типов**: глобальный `EventBus` с произвольными строковыми событиями — посредник, превратившийся в скрытую паутину. Каждый может послать что угодно кому угодно, а найти, кто обрабатывает событие, — сложно.

```ts
// Плохо: глобальная нетипизированная шина
eventBus.emit('filters-changed', anything);

// Лучше: типизированный посредник с ограниченной областью видимости
mediator.setDates(range);
```

> [!INTERVIEW]
> «Как организовать взаимодействие нескольких соседних компонентов на странице?» — Если компонентов два-три — через общего родителя: outputs вверх, inputs вниз. Если больше или они в разных ветках дерева — сервис-посредник в `providers` страницы: он хранит общее состояние в сигналах и содержит правила координации, а компоненты внедряют его и не знают друг о друге. Это паттерн Mediator; важно ограничивать его область видимости фичей.

## Коротко

- Mediator заменяет связи «каждый с каждым» связями с посредником.
- В Angular — сервис в `providers` страницы с сигналами и методами.
- Простой посредник — общий родительский компонент.
- Избегайте глобальных нетипизированных шин событий.
- Посредник на фичу, а не на приложение.
