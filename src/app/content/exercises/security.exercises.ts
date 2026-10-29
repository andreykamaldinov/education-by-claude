import type { Exercise } from '../../domain/exercise.model';

export const SECURITY_EXERCISES = [
  {
    id: 'sec-escape-html',
    trackId: 'security',
    title: 'Экранирование HTML',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'xss',
    description: `Напишите \`escapeHtml(text)\`, которая делает строку безопасной для вставки в HTML как текст: заменяет \`&\`, \`<\`, \`>\`, \`"\` и \`'\` на сущности \`&amp;\`, \`&lt;\`, \`&gt;\`, \`&quot;\`, \`&#39;\`.

Важно: \`&\` нужно заменять первым или за один проход — иначе получится двойное экранирование. Именно это делает интерполяция \`{{ }}\` в Angular (через \`textContent\`).`,
    starter: `function escapeHtml(text: string): string {
  return text;
}
`,
    solution: `const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}
`,
    tests: [
      { name: 'тег script обезврежен', code: `expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');` },
      { name: 'кавычки в атрибутах', code: `expect(escapeHtml('" onerror="x')).toBe('&quot; onerror=&quot;x');
expect(escapeHtml("it's")).toBe('it&#39;s');` },
      { name: 'нет двойного экранирования', code: `expect(escapeHtml('a & b < c')).toBe('a &amp; b &lt; c');
expect(escapeHtml('&lt;')).toBe('&amp;lt;');` },
      { name: 'обычный текст не меняется', code: `expect(escapeHtml('Привет, мир')).toBe('Привет, мир');` },
    ],
    hints: ['Один проход replace с регулярным выражением [&<>"\'] и таблицей замен.'],
  },
  {
    id: 'sec-safe-url',
    trackId: 'security',
    title: 'Безопасные ссылки',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'dom-sanitizer',
    description: `Пользователь указывает ссылку на свой сайт в профиле. Напишите \`isSafeUrl(url)\`:

- разрешены относительные пути (\`/path\`, \`page?x=1\`, \`#anchor\`) и схемы \`http:\`, \`https:\`, \`mailto:\`, \`tel:\`;
- запрещены \`javascript:\`, \`data:\`, \`vbscript:\` и любые другие схемы;
- учтите обходы: регистр (\`JaVaScRiPt:\`), пробелы и управляющие символы в начале и внутри схемы (\`" javascript:"\`, \`"java\\tscript:"\`), протокол-относительные URL \`//evil.com\` — запрещены.

Подсказка: так же рассуждает санитайзер URL в Angular.`,
    starter: `function isSafeUrl(url: string): boolean {
  return true;
}
`,
    solution: `const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function isSafeUrl(url: string): boolean {
  // Браузеры игнорируют пробелы и управляющие символы в схеме — удаляем их так же
  const normalized = url.replace(/[\\u0000-\\u0020\\u007f]/g, '').toLowerCase();
  if (normalized.startsWith('//')) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
  if (!scheme) return true; // относительная ссылка
  return ALLOWED_SCHEMES.has(scheme[1] + ':');
}
`,
    tests: [
      { name: 'разрешённые ссылки', code: `['https://example.com', 'http://a.ru/x?y=1', 'mailto:me@a.ru', 'tel:+79990001122', '/profile', 'page?tab=2', '#top']
  .forEach((url) => expect(isSafeUrl(url)).toBe(true));` },
      { name: 'опасные схемы', code: `['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:msgbox', 'file:///etc/passwd']
  .forEach((url) => expect(isSafeUrl(url)).toBe(false));` },
      { name: 'обходы регистром и пробелами', code: `expect(isSafeUrl('JaVaScRiPt:alert(1)')).toBe(false);
expect(isSafeUrl('  javascript:alert(1)')).toBe(false);
expect(isSafeUrl('java\\tscript:alert(1)')).toBe(false);
expect(isSafeUrl('java\\nscript:alert(1)')).toBe(false);` },
      { name: 'протокол-относительный URL', code: `expect(isSafeUrl('//evil.example/phish')).toBe(false);` },
    ],
    hints: ['Сначала нормализуйте строку: удалите управляющие символы и пробелы, приведите к нижнему регистру.', 'Схема — это буквы до первого двоеточия; нет схемы — относительный путь.'],
  },
  {
    id: 'sec-safe-path',
    trackId: 'security',
    title: 'Защита от path traversal',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'owasp-frontend',
    description: `Сервер (например, MCP-сервер или dev-прокси) отдаёт файлы из папки \`root\` по пути от пользователя. Напишите \`resolveSafe(root, userPath)\`:

- склеивает путь и нормализует \`.\` и \`..\`;
- возвращает итоговый путь, если он **внутри** \`root\`;
- возвращает \`null\`, если путь выходит за пределы \`root\` (\`../../etc/passwd\`), абсолютный (\`/etc/passwd\`) или содержит нулевой байт;
- разделитель — только \`/\`; обратный слеш \`\\\` считайте подозрительным и запрещайте.`,
    starter: `function resolveSafe(root: string, userPath: string): string | null {
  return root + '/' + userPath;
}
`,
    solution: `function resolveSafe(root: string, userPath: string): string | null {
  if (userPath.includes('\\0') || userPath.includes('\\\\') || userPath.startsWith('/')) return null;
  const rootParts = root.split('/').filter(Boolean);
  const parts = [...rootParts];
  for (const segment of userPath.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (parts.length <= rootParts.length) return null;
      parts.pop();
    } else {
      parts.push(segment);
    }
  }
  return '/' + parts.join('/');
}
`,
    tests: [
      { name: 'обычные пути', code: `expect(resolveSafe('/srv/files', 'docs/readme.md')).toBe('/srv/files/docs/readme.md');
expect(resolveSafe('/srv/files', './a/../b.txt')).toBe('/srv/files/b.txt');` },
      { name: 'выход за корень', code: `expect(resolveSafe('/srv/files', '../secret')).toBeNull();
expect(resolveSafe('/srv/files', 'a/../../etc/passwd')).toBeNull();` },
      { name: 'абсолютные пути и обходы', code: `expect(resolveSafe('/srv/files', '/etc/passwd')).toBeNull();
expect(resolveSafe('/srv/files', '..\\\\..\\\\windows')).toBeNull();
expect(resolveSafe('/srv/files', 'a.txt\\0.png')).toBeNull();` },
    ],
    hints: ['Идите по сегментам и ведите стек; «..» снимает сегмент, но не ниже корня.'],
  },
  {
    id: 'sec-csp-builder',
    trackId: 'security',
    title: 'Сборщик Content-Security-Policy',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'csp-trusted-types',
    description: `Напишите \`buildCsp(policy, nonce?)\`, превращающую объект в значение заголовка:

~~~ts
buildCsp({ 'default-src': ["'self'"], 'script-src': ["'self'", '{nonce}'], 'object-src': ["'none'"] }, 'abc');
// "default-src 'self'; script-src 'self' 'nonce-abc'; object-src 'none'"
~~~

- плейсхолдер \`{nonce}\` заменяется на \`'nonce-<значение>'\`; если nonce не передан — выбросить ошибку;
- директивы с пустым списком выводятся без значений (\`upgrade-insecure-requests\`);
- \`'unsafe-inline'\` в \`script-src\` запрещён — выбросить ошибку с текстом \`unsafe-inline\`.`,
    starter: `type CspPolicy = Record<string, string[]>;

function buildCsp(policy: CspPolicy, nonce?: string): string {
  return '';
}
`,
    solution: `type CspPolicy = Record<string, string[]>;

function buildCsp(policy: CspPolicy, nonce?: string): string {
  return Object.entries(policy)
    .map(([directive, sources]) => {
      if (directive === 'script-src' && sources.includes("'unsafe-inline'")) {
        throw new Error("script-src не должен содержать 'unsafe-inline'");
      }
      const values = sources.map((source) => {
        if (source !== '{nonce}') return source;
        if (!nonce) throw new Error('Для {nonce} нужен nonce');
        return "'nonce-" + nonce + "'";
      });
      return [directive, ...values].join(' ');
    })
    .join('; ');
}
`,
    tests: [
      { name: 'собирает заголовок', code: `expect(buildCsp({ 'default-src': ["'self'"], 'script-src': ["'self'", '{nonce}'], 'object-src': ["'none'"] }, 'abc'))
  .toBe("default-src 'self'; script-src 'self' 'nonce-abc'; object-src 'none'");` },
      { name: 'директива без значений', code: `expect(buildCsp({ 'upgrade-insecure-requests': [], 'img-src': ['https:'] })).toBe('upgrade-insecure-requests; img-src https:');` },
      { name: 'запрет unsafe-inline для скриптов', code: `expect(() => buildCsp({ 'script-src': ["'self'", "'unsafe-inline'"] })).toThrow('unsafe-inline');` },
      { name: 'nonce обязателен для плейсхолдера', code: `expect(() => buildCsp({ 'script-src': ['{nonce}'] })).toThrow('nonce');` },
    ],
    hints: ['Object.entries + map + join("; ").'],
  },
] as const satisfies readonly Exercise[];
