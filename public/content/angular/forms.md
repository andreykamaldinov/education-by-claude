В Angular три подхода к формам: **reactive** (модель формы в классе), **template-driven** (модель описывается директивами в шаблоне) и **Signal Forms** — новый API на сигналах, ставший стабильным в Angular 22. Разберём все три и общие механизмы: валидацию, статусы, собственные контролы.

## Reactive forms

```ts
@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" type="email" />
      @if (form.controls.email.touched && form.controls.email.hasError('email')) {
        <p class="error">Некорректный email</p>
      }

      <div formGroupName="profile">
        <input formControlName="name" />
        <input formControlName="age" type="number" />
      </div>

      <button [disabled]="form.invalid || form.pending">Создать аккаунт</button>
    </form>
  `,
})
export class Signup {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email], [uniqueEmailValidator()]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    profile: this.fb.group({
      name: ['', Validators.required],
      age: this.fb.control<number | null>(null, Validators.min(14)),
    }),
  });

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue(); // { email: string; password: string; profile: {...} }
  }
}
```

### Строительные блоки

| Класс | Что представляет |
| --- | --- |
| `FormControl<T>` | одно поле |
| `FormGroup<{...}>` | объект с фиксированными полями |
| `FormArray<T>` | список однотипных контролов (динамические строки) |
| `FormRecord<T>` | объект с динамическими ключами |

### Типизация

С Angular 14 формы строго типизированы. `NonNullableFormBuilder` (или `{ nonNullable: true }`) делает так, что `reset()` возвращает начальное значение, а не `null`, и тип поля — `string`, а не `string | null`.

- `form.value` — тип с необязательными полями: **отключённые** контролы в него не входят.
- `form.getRawValue()` — все поля, включая отключённые.

### Наблюдение за изменениями

```ts
this.form.controls.email.valueChanges.pipe(debounceTime(300), takeUntilDestroyed());
this.form.statusChanges; // 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'
this.form.events; // единый поток событий: ValueChange, StatusChange, TouchedChange, FormSubmitted...
```

## Валидаторы

```ts
// Синхронный: возвращает объект ошибок или null
export const forbiddenWord =
  (word: string): ValidatorFn =>
  (control) =>
    typeof control.value === 'string' && control.value.toLowerCase().includes(word)
      ? { forbiddenWord: { word } }
      : null;

// Валидатор группы: сравнение полей
export const passwordsMatch: ValidatorFn = (group) => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
};

// Асинхронный: Observable/Promise с результатом
export function uniqueEmailValidator(): AsyncValidatorFn {
  const api = inject(UserApi);
  return (control) =>
    timer(400).pipe(
      switchMap(() => api.isEmailTaken(control.value)),
      map((taken) => (taken ? { emailTaken: true } : null)),
      catchError(() => of(null)),
    );
}
```

Асинхронные валидаторы запускаются только когда синхронные прошли; пока они работают, статус — `PENDING`.

## Статусы контрола

| Свойство | Значение |
| --- | --- |
| `valid` / `invalid` / `pending` / `disabled` | статус валидации |
| `touched` / `untouched` | был ли blur |
| `dirty` / `pristine` | менял ли пользователь значение |

Показывайте ошибки после `touched` (или после попытки отправки), а не сразу — иначе форма «кричит» на пользователя до того, как он начал вводить.

## Template-driven forms

```html
<form #f="ngForm" (ngSubmit)="save(f.value)">
  <input name="title" [(ngModel)]="draft.title" required minlength="3" #title="ngModel" />
  @if (title.invalid && title.touched) {
    <p>Минимум 3 символа</p>
  }
  <button [disabled]="f.invalid">Сохранить</button>
</form>
```

Проще для маленьких форм, но модель формы создаётся асинхронно директивами, её труднее тестировать и типизировать.

## Signal Forms (Angular 22)

Новый API строит форму вокруг **модели-сигнала**: форма не хранит свою копию данных, а читает и пишет напрямую в сигнал.

```ts
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';

type Login = { email: string; password: string };

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)" novalidate>
      <input type="email" [formField]="loginForm.email" />
      @for (error of loginForm.email().errors(); track error.kind) {
        <p class="error">{{ error.message }}</p>
      }

      <input type="password" [formField]="loginForm.password" />

      <button [disabled]="loginForm().invalid() || loginForm().submitting()">Войти</button>
    </form>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  protected readonly model = signal<Login>({ email: '', password: '' });

  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Укажите email' });
    email(path.email, { message: 'Некорректный email' });
    required(path.password);
    minLength(path.password, 8, { message: 'Минимум 8 символов' });
  });

  protected async onSubmit(event: Event) {
    event.preventDefault();
    await submit(this.loginForm, async (field) => {
      const ok = await this.auth.login(field().value());
      return ok ? undefined : [{ kind: 'server', message: 'Неверный email или пароль' }];
    });
  }
}
```

Ключевые идеи:

- `form(model, schema)` возвращает **дерево полей** (`FieldTree`), повторяющее форму модели: `loginForm.email`, `loginForm.address.city`.
- Состояние поля — сигналы: `field().value()`, `valid()`, `errors()`, `touched()`, `dirty()`, `pending()`, `disabled()`.
- Директива `[formField]` связывает поле с input (или с вашим компонентом-контролом).
- Схема декларативна: `required`, `email`, `min`, `max`, `pattern`, `validate` (своя логика), `validateAsync`/`validateHttp`, а также `disabled`, `hidden`, `readonly` и `debounce` для полей.
- `submit()` выставляет `submitting`, вызывает действие и умеет вернуть серверные ошибки прямо в поля.
- Директива `[formRoot]` на `<form>` берёт обработку `submit` на себя, если отправка описана при создании формы.

> [!NOTE]
> Reactive forms никуда не уходят и остаются стандартом в существующих проектах. Signal Forms выгодны в новых, полностью сигнальных компонентах: нет `valueChanges`-подписок, производные значения формы — обычные `computed`.

## Собственный контрол формы

### Для reactive и template-driven: ControlValueAccessor

```ts
@Component({
  selector: 'app-rating',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: Rating, multi: true }],
  template: `
    @for (star of stars; track star) {
      <button type="button" (click)="select(star)" [disabled]="disabled()">
        {{ star <= value() ? '★' : '☆' }}
      </button>
    }
  `,
})
export class Rating implements ControlValueAccessor {
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly value = signal(0);
  protected readonly disabled = signal(false);
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null) { this.value.set(value ?? 0); } // форма → компонент
  registerOnChange(fn: (value: number) => void) { this.onChange = fn; } // компонент → форма
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(disabled: boolean) { this.disabled.set(disabled); }

  protected select(star: number) {
    this.value.set(star);
    this.onChange(star);
    this.onTouched();
  }
}
```

```html
<app-rating formControlName="rating" />
```

### Для Signal Forms: FormValueControl

Достаточно реализовать интерфейс с `model()`:

```ts
@Component({ selector: 'app-rating-signal', template: `...` })
export class RatingSignal implements FormValueControl<number> {
  readonly value = model(0);
  readonly disabled = input(false);
}
```

`[formField]` сам свяжет `value`, `disabled`, `touched` и ошибки.

> [!INTERVIEW]
> «Чем reactive forms отличаются от template-driven?» — В reactive модель формы создаётся явно в классе (`FormGroup`, `FormControl`), синхронно, строго типизирована, валидация — функциями; это удобнее для сложных и динамических форм и тестирования. В template-driven модель создают директивы `ngModel` в шаблоне, асинхронно; меньше кода для простых форм, но хуже контроль. Signal Forms (Angular 22) строят форму поверх сигнала-модели со схемой валидации и сигнальным состоянием полей.

## Коротко

- Reactive: `FormGroup`/`FormControl`/`FormArray`, типизация, `NonNullableFormBuilder`.
- Валидаторы — функции; асинхронные дают статус `PENDING`.
- Ошибки показывайте после `touched` или попытки отправки.
- Signal Forms: `form(model, schema)`, `[formField]`, сигнальные статусы, `submit()`.
- Свой контрол: `ControlValueAccessor` или `FormValueControl` с `model()`.
