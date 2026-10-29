import type { Quiz } from '../../domain/quiz.model';

export const RXJS_QUIZ = {
  trackId: 'rxjs',
  questions: [
    {
      id: 'switch-vs-others',
      prompt: 'Какой оператор выбрать для поиска с автокомплитом, чтобы устаревшие ответы не перезаписывали новые?',
      options: ['mergeMap', 'concatMap', 'switchMap', 'exhaustMap'],
      correctIndex: 2,
      explanation:
        '`switchMap` при новом значении отписывается от предыдущего внутреннего потока — HTTP-запрос отменяется. Подробнее — [операторы высшего порядка](/tracks/rxjs/higher-order).',
    },
    {
      id: 'exhaust-submit',
      prompt: 'Пользователь многократно жмёт «Оплатить». Какой оператор защитит от повторных платежей?',
      options: ['switchMap', 'exhaustMap', 'mergeMap', 'combineLatest'],
      correctIndex: 1,
      explanation:
        '`exhaustMap` игнорирует новые значения, пока внутренний поток не завершился. `switchMap` отменил бы запрос на клиенте, но сервер мог уже списать деньги.',
    },
    {
      id: 'concat-order',
      prompt: 'Сохранения черновика должны уходить на сервер строго по порядку. Какой оператор?',
      options: ['concatMap', 'switchMap', 'mergeMap', 'exhaustMap'],
      correctIndex: 0,
      explanation: '`concatMap` ставит значения в очередь и подписывается на следующий внутренний поток только после завершения предыдущего.',
    },
    {
      id: 'hot-cold-http',
      prompt: 'В шаблоне три раза написано (user$ | async), где user$ = http.get(...). Сколько запросов уйдёт?',
      options: ['1', '3', '0', 'Зависит от кеша браузера'],
      correctIndex: 1,
      explanation:
        'HTTP-поток холодный: каждая подписка запускает отдельное выполнение. Решения: одна подписка через `@let`/`@if ... as`, `toSignal` или `shareReplay`.',
    },
    {
      id: 'combine-vs-fork',
      prompt: 'Чем forkJoin отличается от combineLatest?',
      options: [
        'Ничем',
        'forkJoin ждёт завершения всех и выдаёт последние значения один раз; combineLatest выдаёт при каждом изменении любого источника',
        'forkJoin работает только с Subject',
        'combineLatest ждёт завершения всех потоков',
      ],
      correctIndex: 1,
      explanation:
        '`forkJoin` — аналог `Promise.all` для конечных потоков (HTTP). С бесконечным потоком (valueChanges, BehaviorSubject) он никогда не выдаст значение.',
    },
    {
      id: 'combine-silent',
      prompt: 'combineLatest([a$, b$]) ничего не выдаёт, хотя a$ уже выдал значение. Вероятная причина?',
      options: [
        'b$ ещё не выдал ни одного значения',
        'combineLatest работает только с Promise',
        'Нужно вызвать connect()',
        'Значения выдаются только после complete',
      ],
      correctIndex: 0,
      explanation: '`combineLatest` ждёт хотя бы одно значение от каждого источника. Добавьте `startWith` или используйте `BehaviorSubject`.',
    },
    {
      id: 'catch-placement',
      prompt: 'Поиск перестал работать после первой сетевой ошибки. catchError стоит после switchMap. Как исправить?',
      options: [
        'Добавить retry() в конец',
        'Перенести catchError внутрь switchMap — на поток конкретного запроса',
        'Заменить switchMap на mergeMap',
        'Обернуть subscribe в try/catch',
      ],
      correctIndex: 1,
      explanation:
        'Ошибка — терминальное событие. `catchError` на внешнем потоке заменяет весь поток, и подписка на ввод пропадает. Внутри `switchMap` он заменяет только результат одного запроса.',
    },
    {
      id: 'behavior-vs-replay',
      prompt: 'Чем BehaviorSubject отличается от ReplaySubject(1)?',
      options: [
        'Ничем',
        'BehaviorSubject требует начальное значение и даёт getValue(); ReplaySubject(1) без начального значения',
        'ReplaySubject нельзя завершить',
        'BehaviorSubject хранит все значения',
      ],
      correctIndex: 1,
      explanation:
        'Подписчик `BehaviorSubject` сразу получает текущее значение. У `ReplaySubject(1)` до первого `next` подписчик ничего не получит.',
    },
    {
      id: 'share-replay-refcount',
      prompt: 'Чем опасен interval(1000).pipe(shareReplay(1)) в компоненте?',
      options: [
        'Ничем',
        'Без refCount: true подписка на interval останется после ухода всех подписчиков — утечка',
        'shareReplay не работает с interval',
        'Значения будут приходить дважды',
      ],
      correctIndex: 1,
      explanation:
        '`shareReplay(1)` эквивалентен `{ bufferSize: 1, refCount: false }`. Для бесконечных источников используйте `refCount: true`.',
    },
    {
      id: 'debounce-vs-throttle',
      prompt: 'Чем debounceTime(300) отличается от throttleTime(300)?',
      options: [
        'Ничем',
        'debounceTime ждёт 300 мс тишины и выдаёт последнее значение; throttleTime выдаёт первое и игнорирует остальные 300 мс',
        'throttleTime работает только с кликами',
        'debounceTime выдаёт первое значение',
      ],
      correctIndex: 1,
      explanation: 'При непрерывном потоке событий `debounceTime` не выдаст ничего, а `throttleTime` будет выдавать регулярно.',
    },
    {
      id: 'take-until-order',
      prompt: 'Почему takeUntilDestroyed() нужно ставить последним в pipe?',
      options: [
        'Это требование синтаксиса',
        'Иначе операторы после него (например, switchMap) могут держать внутренние подписки после уничтожения компонента',
        'Он не работает в начале pipe',
        'Для производительности',
      ],
      correctIndex: 1,
      explanation: 'Оператор отписывает поток выше себя. Внутренний поток `switchMap`, стоящего ниже, продолжит жить.',
    },
    {
      id: 'observable-vs-promise',
      prompt: 'Какое утверждение об Observable верно?',
      options: [
        'Начинает выполняться сразу при создании',
        'Всегда асинхронен',
        'Ленив: выполняется при подписке, может выдать много значений и отменяется отпиской',
        'Не может завершиться с ошибкой',
      ],
      correctIndex: 2,
      explanation: 'Promise жадный, одно значение, без отмены. Observable ленивый, 0..∞ значений, может быть синхронным, отменяется `unsubscribe`.',
    },
  ],
} as const satisfies Quiz;
