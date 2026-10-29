**Single Responsibility Principle**: у модуля должна быть одна причина для изменения. Роберт Мартин уточняет: модуль должен отвечать перед одним «актором» — одной группой людей, которая может потребовать изменений. Это не «класс делает одну вещь», а «класс меняется по одной причине».

## Нарушение

```ts
@Component({
  selector: 'app-invoice',
  template: `...`,
})
export class InvoiceComponent {
  private readonly http = inject(HttpClient);
  invoice?: Invoice;

  ngOnInit() {
    this.http.get<InvoiceDto>(`/api/invoices/${this.id}`).subscribe((dto) => {
      // маппинг формата API
      this.invoice = { ...dto, date: new Date(dto.created_at), total: dto.amount_cents / 100 };
    });
  }

  get tax() {
    // бизнес-правило расчёта налога
    return this.invoice!.region === 'EU' ? this.invoice!.total * 0.2 : this.invoice!.total * 0.13;
  }

  exportPdf() {
    // генерация PDF: шрифты, разметка, отступы
  }

  sendByEmail() {
    // формирование письма и отправка
  }
}
```

Причины для изменения этого компонента:

- поменялся формат API (бэкенд-команда);
- поменялась ставка налога (бухгалтерия);
- поменялся вид PDF (дизайнеры документов);
- поменялся текст письма (маркетинг);
- поменялась вёрстка экрана (UI).

Каждое изменение рискует сломать остальное, а тестировать налог приходится через компонент.

## Разделение

```ts
// Доступ к данным и маппинг формата API
@Injectable({ providedIn: 'root' })
export class InvoiceApi {
  private readonly http = inject(HttpClient);
  get(id: string) {
    return this.http.get<InvoiceDto>(`/api/invoices/${id}`).pipe(map(toInvoice));
  }
}

// Чистое бизнес-правило — тестируется без Angular
export const calculateTax = (invoice: Invoice): number =>
  invoice.total * (invoice.region === 'EU' ? 0.2 : 0.13);

// Экспорт
@Injectable({ providedIn: 'root' })
export class InvoicePdfExporter {
  export(invoice: Invoice): Blob { /* ... */ }
}

// Компонент — только отображение и связывание
@Component({ selector: 'app-invoice', template: `...` })
export class InvoiceComponent {
  readonly id = input.required<string>();
  private readonly api = inject(InvoiceApi);
  protected readonly pdf = inject(InvoicePdfExporter);

  protected readonly invoice = rxResource({ params: () => this.id(), stream: ({ params }) => this.api.get(params) });
  protected readonly tax = computed(() => {
    const invoice = this.invoice.value();
    return invoice ? calculateTax(invoice) : 0;
  });
}
```

## SRP на разных уровнях

- **Функция** — один уровень абстракции, одно действие. Функция `validateAndSaveAndNotify` — сигнал к разделению.
- **Компонент** — отображение и пользовательское взаимодействие; данные, правила и инфраструктура — в сервисах.
- **Сервис** — одна область: `AuthService` не должен форматировать даты.
- **Модуль/библиотека** — одна фича или один слой (в Nx: `feature`, `ui`, `data-access`, `util`).

## Признаки нарушения

- Класс трудно назвать без «And», «Manager», «Helper», «Utils».
- Сотни строк и десятки зависимостей в конструкторе.
- Изменение одной функции требует перезапуска тестов, не связанных с ней.
- Конфликты слияния: несколько людей по разным задачам правят один файл.

## Не перестарайтесь

SRP не означает «по одному методу на класс». Разделение по искусственным границам создаёт россыпь крошечных классов, между которыми приходится прыгать. Ориентир — **причины изменений**: вещи, которые меняются вместе по одной причине, должны быть вместе (cohesion); вещи, которые меняются по разным причинам, — раздельно.

> [!INTERVIEW]
> «Объясните SRP на примере из Angular» — Компонент, который сам делает HTTP-запросы, маппит DTO, считает бизнес-правила и генерирует PDF, меняется по разным причинам и разными людьми. По SRP доступ к API выносится в сервис data-access, бизнес-правила — в чистые функции или доменный сервис, экспорт — в отдельный сервис, а компоненту остаётся отображение и связывание данных. Каждую часть проще тестировать и менять.

## Коротко

- Одна причина для изменения = один «актор», которому модуль подчиняется.
- В Angular: компонент — UI, сервисы — данные, правила и инфраструктура.
- Бизнес-правила — в чистые функции: их проще всего тестировать.
- Признаки нарушения: имя с «And»/«Manager», много зависимостей, конфликты слияния.
- Не дробите до абсурда: связанное по смыслу держите вместе.
