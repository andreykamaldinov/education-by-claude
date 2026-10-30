**Template Method** задаёт скелет алгоритма в базовом классе, а отдельные шаги позволяет переопределить наследникам. Порядок шагов фиксирован, детали — меняются.

## Структура

```ts
abstract class DataImporter<Row> {
  // Шаблонный метод: последовательность шагов не меняется
  async import(file: File): Promise<ImportReport> {
    const text = await file.text();
    const rawRows = this.parse(text);
    const rows: Row[] = [];
    const errors: string[] = [];

    for (const [index, raw] of rawRows.entries()) {
      const result = this.validate(raw);
      if (typeof result === 'string') {
        errors.push(`Строка ${index + 1}: ${result}`);
      } else {
        rows.push(result);
      }
    }

    await this.save(rows);
    this.afterImport?.(rows); // необязательный «хук»
    return { imported: rows.length, errors };
  }

  protected abstract parse(text: string): unknown[];
  protected abstract validate(raw: unknown): Row | string;
  protected abstract save(rows: Row[]): Promise<void>;
  protected afterImport?(rows: Row[]): void;
}

class CsvProductImporter extends DataImporter<Product> {
  protected parse(text: string) {
    return text.split('\n').slice(1).map((line) => line.split(';'));
  }

  protected validate(raw: unknown) {
    return Array.isArray(raw) && raw.length === 3 ? toProduct(raw) : 'ожидалось 3 колонки';
  }

  protected save(rows: Product[]) {
    return this.api.bulkCreate(rows);
  }
}
```

- **Абстрактные шаги** — обязательны для наследника.
- **Хуки** — необязательные шаги с поведением по умолчанию (или пустые).
- **Шаблонный метод** обычно не переопределяют.

## Принцип Голливуда

«Не звоните нам — мы позвоним вам»: базовый класс вызывает методы наследника, а не наоборот. Это **инверсия управления**, и на ней построены фреймворки.

## Template Method в Angular

Хуки жизненного цикла — это шаги «шаблонного алгоритма» фреймворка:

```text
Алгоритм Angular (фиксирован):
  создать компонент → установить inputs → ngOnChanges → ngOnInit → проверить шаблон
  → ngAfterViewInit → … → ngOnDestroy
Ваши «шаги» (необязательные хуки):
  ngOnInit() { … }  ngOnDestroy() { … }
```

Angular не наследует от вас, но идея та же: фреймворк задаёт порядок, вы заполняете шаги.

Также:

- `TitleStrategy.updateTitle()` — вы переопределяете один шаг, а `buildTitle()` даёт готовый результат из маршрутов.
- `ErrorHandler.handleError()` — переопределяемый шаг обработки ошибок.
- Абстрактные классы CDK (`DataSource.connect/disconnect`) — шаги, которые вызывает таблица.

## Функциональная альтернатива

В TypeScript шаги часто передают функциями — это ближе к [Strategy](/tracks/patterns/strategy), но без наследования:

```ts
type ImportSteps<Row> = {
  parse(text: string): unknown[];
  validate(raw: unknown): Row | string;
  save(rows: Row[]): Promise<void>;
  afterImport?(rows: Row[]): void;
};

export async function importFile<Row>(file: File, steps: ImportSteps<Row>): Promise<ImportReport> {
  /* тот же скелет алгоритма */
}

await importFile(file, { parse: parseCsv, validate: toProduct, save: (rows) => api.bulkCreate(rows) });
```

| | Template Method | Функция со «стратегиями» |
| --- | --- | --- |
| Механизм | наследование | композиция |
| Связь | жёсткая, через базовый класс | слабая |
| Состояние шагов | поля класса | замыкания / объект |
| Когда | есть общая реализация и защищённые поля | шаги независимы |

> [!INTERVIEW]
> «Где в Angular виден Template Method?» — Хуки жизненного цикла: фреймворк определяет неизменный порядок создания, проверки и уничтожения компонента и вызывает ваши `ngOnInit`, `ngAfterViewInit`, `ngOnDestroy` в нужные моменты — принцип «не звоните нам, мы позвоним вам». Также расширяемые классы фреймворка вроде `TitleStrategy` и `ErrorHandler`, где переопределяется отдельный шаг готового алгоритма.

## Коротко

- Template Method — скелет алгоритма в базовом классе, шаги — в наследниках.
- Абстрактные шаги обязательны, хуки — опциональны.
- Инверсия управления: базовый класс вызывает наследника.
- Хуки жизненного цикла Angular — тот же принцип.
- Функциональная альтернатива — передать шаги объектом функций.
