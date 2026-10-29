Фабрики отделяют **создание** объектов от их **использования**. Код-клиент просит «дай мне уведомитель», не зная, какой именно класс будет создан и как.

## Simple Factory

Функция, которая выбирает и создаёт нужную реализацию:

```ts
type Notifier = { send(to: string, text: string): Promise<void> };

export function createNotifier(channel: 'email' | 'sms' | 'push'): Notifier {
  switch (channel) {
    case 'email':
      return new EmailNotifier();
    case 'sms':
      return new SmsNotifier();
    case 'push':
      return new PushNotifier();
  }
}
```

Знание о том, какие бывают реализации, сосредоточено в одном месте.

## Factory Method

Базовый класс определяет алгоритм, а **создание** части объектов делегирует наследникам через переопределяемый метод:

```ts
abstract class ReportExporter {
  // фабричный метод
  protected abstract createWriter(): ReportWriter;

  export(report: Report): Blob {
    const writer = this.createWriter();
    writer.writeHeader(report.title);
    report.rows.forEach((row) => writer.writeRow(row));
    return writer.finish();
  }
}

class CsvExporter extends ReportExporter {
  protected createWriter() {
    return new CsvWriter();
  }
}

class XlsxExporter extends ReportExporter {
  protected createWriter() {
    return new XlsxWriter();
  }
}
```

## Abstract Factory

Фабрика **семейства** связанных объектов, которые должны сочетаться между собой:

```ts
type UiKit = {
  createButton(label: string): Button;
  createDialog(title: string): Dialog;
  createToast(message: string): Toast;
};

class MaterialKit implements UiKit { /* все компоненты в стиле Material */ }
class NativeMobileKit implements UiKit { /* все компоненты в нативном стиле */ }

function buildCheckout(kit: UiKit) {
  const confirm = kit.createButton('Оплатить');
  const dialog = kit.createDialog('Подтверждение');
  // кнопка и диалог гарантированно из одного семейства
}
```

## Фабрики в Angular

### useFactory

```ts
export const STORAGE = new InjectionToken<Storage>('STORAGE');

providers: [
  {
    provide: STORAGE,
    useFactory: () => {
      const platformId = inject(PLATFORM_ID);
      return isPlatformBrowser(platformId) ? window.localStorage : new MemoryStorage();
    },
  },
];
```

`useFactory` выбирает реализацию в момент создания и может внедрять зависимости через `inject()`.

### InjectionToken с фабрикой по умолчанию

```ts
export const NOW = new InjectionToken<() => Date>('NOW', {
  providedIn: 'root',
  factory: () => () => new Date(), // в тестах подменяется фиксированным временем
});
```

### Фабричные функции с inject

```ts
export function injectQueryParam(name: string): Signal<string | null> {
  const route = inject(ActivatedRoute);
  return toSignal(route.queryParamMap.pipe(map((p) => p.get(name))), { initialValue: null });
}

export class SearchPage {
  protected readonly query = injectQueryParam('q');
}
```

### Динамическое создание компонентов

```ts
const COMPONENTS = {
  chart: () => import('./widgets/chart').then((m) => m.Chart),
  table: () => import('./widgets/table').then((m) => m.Table),
} satisfies Record<WidgetType, () => Promise<Type<unknown>>>;

async render(type: WidgetType) {
  const component = await COMPONENTS[type]();
  this.container().createComponent(component);
}
```

Карта «тип → загрузчик» — фабрика, которую легко расширять без `switch`.

## Когда фабрика лишняя

Если реализация одна и не будет меняться, `new Service()` (а в Angular — `inject(Service)`) проще. Фабрика оправдана, когда выбор реализации зависит от условий (платформа, конфигурация, тип данных) или создание сложное.

> [!INTERVIEW]
> «Чем Factory Method отличается от Abstract Factory?» — Factory Method — один переопределяемый метод создания внутри класса с общим алгоритмом: наследник решает, какой объект создать. Abstract Factory — отдельный объект с несколькими методами создания семейства совместимых объектов (кнопка, диалог, тост в одном стиле); клиент получает фабрику целиком и не может смешать продукты разных семейств.

## Коротко

- Фабрика отделяет создание от использования.
- Simple Factory — функция выбора реализации.
- Factory Method — создание делегировано наследнику.
- Abstract Factory — семейство совместимых объектов.
- В Angular: `useFactory`, токены с `factory`, функции `injectX()`, карты загрузчиков компонентов.
