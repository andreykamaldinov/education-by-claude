**Adapter** преобразует интерфейс одного объекта к интерфейсу, который ожидает клиент. Как переходник для розетки: ни розетку, ни вилку не меняем — ставим посредника.

## Задача

Приложение работает с моделью `User`, а API возвращает другой формат:

```ts
// Что приходит с сервера
type UserDto = {
  user_id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  created_at: string; // ISO-строка
  is_active: 0 | 1;
};

// С чем удобно работать в приложении
type User = {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  active: boolean;
};
```

Если использовать `UserDto` в компонентах напрямую, формат API «протекает» во весь код: переименование поля на бэкенде ломает десятки файлов.

## Адаптер (маппер) на границе

```ts
export const toUser = (dto: UserDto): User => ({
  id: String(dto.user_id),
  fullName: `${dto.first_name} ${dto.last_name}`.trim(),
  email: dto.email_address,
  createdAt: new Date(dto.created_at),
  active: dto.is_active === 1,
});

export const toUserDto = (user: Pick<User, 'fullName' | 'email'>): Partial<UserDto> => {
  const [first_name = '', ...rest] = user.fullName.split(' ');
  return { first_name, last_name: rest.join(' '), email_address: user.email };
};

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  list(): Observable<User[]> {
    return this.http.get<UserDto[]>('/api/users').pipe(map((dtos) => dtos.map(toUser)));
  }
}
```

Формат API знает только слой data-access. Изменился бэкенд — правится один маппер.

> [!TIP]
> Маппер — хорошее место для валидации ответа (схемой Zod/Valibot): данные проверяются один раз на границе, а внутри приложения типы можно считать правдой.

## Адаптер над сторонней библиотекой

```ts
// Свой контракт, удобный приложению
export abstract class Notifier {
  abstract success(message: string): void;
  abstract error(message: string): void;
}

// Адаптер к конкретной библиотеке уведомлений
@Injectable()
export class SnackbarNotifier extends Notifier {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string) {
    this.snackBar.open(message, undefined, { duration: 3000, panelClass: 'snack-success' });
  }

  error(message: string) {
    this.snackBar.open(message, 'Закрыть', { duration: 8000, panelClass: 'snack-error' });
  }
}

providers: [{ provide: Notifier, useClass: SnackbarNotifier }];
```

Сменили библиотеку — пишем новый адаптер, остальной код не трогаем. Это частный случай [DIP](/tracks/oop-solid/dip) и правила «оборачивайте сторонние API на границе».

## Адаптеры в Angular

| Механизм | Что адаптирует |
| --- | --- |
| `ControlValueAccessor` | ваш компонент → API форм Angular |
| `DateAdapter` (Angular Material) | любую библиотеку дат → datepicker |
| `toSignal` / `toObservable` | Observable ↔ Signal |
| `from(promise)` | Promise → Observable |
| `HttpBackend` (`FetchBackend`, `HttpXhrBackend`) | `fetch` или XHR → интерфейс HttpClient |

```ts
// Адаптер колбэчного API к Observable
export function fromResizeObserver(element: Element): Observable<DOMRectReadOnly> {
  return new Observable((subscriber) => {
    const observer = new ResizeObserver(([entry]) => entry && subscriber.next(entry.contentRect));
    observer.observe(element);
    return () => observer.disconnect();
  });
}
```

## Adapter, Facade, Decorator — в чём разница

| Паттерн | Интерфейс | Цель |
| --- | --- | --- |
| Adapter | **меняет** на ожидаемый клиентом | совместимость |
| Facade | **упрощает** набор интерфейсов | удобный вход в подсистему |
| Decorator | **сохраняет** тот же | добавить поведение |

> [!INTERVIEW]
> «Зачем маппить DTO в доменную модель, а не использовать ответ API напрямую?» — Это адаптер на границе: формат бэкенда (snake_case, строки дат, флаги 0/1) не протекает в компоненты, изменения API правятся в одном месте, доменная модель удобна приложению (`Date`, `boolean`, вычисленные поля), а ответ можно провалидировать один раз при входе.

## Коротко

- Adapter приводит чужой интерфейс к ожидаемому, не меняя ни одну из сторон.
- DTO → доменная модель — адаптер на границе data-access.
- Сторонние библиотеки оборачивайте своим контрактом.
- В Angular: `ControlValueAccessor`, `DateAdapter`, `toSignal`, `HttpBackend`.
- Колбэчные API удобно адаптировать к Observable.
