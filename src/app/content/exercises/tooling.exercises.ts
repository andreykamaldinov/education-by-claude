import type { Exercise } from '../../domain/exercise.model';

/** Exercises for the build tooling and AI/MCP tracks. */
export const TOOLING_EXERCISES = [
  {
    id: 'build-module-graph',
    trackId: 'tooling',
    title: 'Граф модулей: порядок сборки и циклы',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'bundlers-basics',
    description: `Сборщик получает граф модулей: \`{ 'main.ts': ['app.ts', 'config.ts'], 'app.ts': ['utils.ts'], ... }\` — для каждого файла список его импортов.

Напишите \`buildOrder(graph, entry)\`:

- возвращает модули, **достижимые** из \`entry\`, в порядке, где каждый модуль идёт **после** своих зависимостей (топологическая сортировка; так модули инициализируются);
- недостижимые модули не включаются (это и есть «tree-shaking» на уровне файлов);
- при циклической зависимости бросает ошибку с текстом \`Цикл: a.ts → b.ts → a.ts\`.`,
    starter: `type ModuleGraph = Record<string, string[]>;

function buildOrder(graph: ModuleGraph, entry: string): string[] {
  return Object.keys(graph);
}
`,
    solution: `type ModuleGraph = Record<string, string[]>;

function buildOrder(graph: ModuleGraph, entry: string): string[] {
  const order: string[] = [];
  const done = new Set<string>();
  const stack: string[] = [];

  const visit = (file: string): void => {
    if (done.has(file)) return;
    const cycleStart = stack.indexOf(file);
    if (cycleStart !== -1) {
      throw new Error('Цикл: ' + [...stack.slice(cycleStart), file].join(' → '));
    }
    stack.push(file);
    for (const dependency of graph[file] ?? []) visit(dependency);
    stack.pop();
    done.add(file);
    order.push(file);
  };

  visit(entry);
  return order;
}
`,
    tests: [
      { name: 'зависимости раньше зависящих', code: `const graph = { 'main.ts': ['app.ts', 'config.ts'], 'app.ts': ['utils.ts'], 'config.ts': ['utils.ts'], 'utils.ts': [] };
const order = buildOrder(graph, 'main.ts');
expect(order).toHaveLength(4);
expect(order.indexOf('utils.ts')).toBeLessThan(order.indexOf('app.ts'));
expect(order.indexOf('app.ts')).toBeLessThan(order.indexOf('main.ts'));
expect(order.at(-1)).toBe('main.ts');` },
      { name: 'недостижимые модули отбрасываются', code: `const graph = { 'main.ts': ['a.ts'], 'a.ts': [], 'unused.ts': ['a.ts'] };
expect(buildOrder(graph, 'main.ts')).toEqual(['a.ts', 'main.ts']);` },
      { name: 'обнаруживает цикл', code: `const graph = { 'main.ts': ['a.ts'], 'a.ts': ['b.ts'], 'b.ts': ['a.ts'] };
expect(() => buildOrder(graph, 'main.ts')).toThrow('Цикл: a.ts → b.ts → a.ts');` },
      { name: 'общая зависимость один раз', code: `const graph = { 'm': ['x', 'y'], 'x': ['z'], 'y': ['z'], 'z': [] };
expect(buildOrder(graph, 'm').filter((f) => f === 'z')).toHaveLength(1);` },
    ],
    hints: ['Обход в глубину: модуль добавляется в результат после всех своих зависимостей.', 'Стек текущего пути позволяет найти цикл и вывести его.'],
  },
  {
    id: 'build-nx-affected',
    trackId: 'tooling',
    title: 'Nx affected своими руками',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'nx',
    description: `Граф проектов монорепозитория: \`{ shop: ['feature-cart', 'ui'], 'feature-cart': ['data-access', 'ui'], ... }\` — от каждого проекта к его зависимостям.

Напишите \`affected(graph, changed)\`: принимает список изменённых проектов и возвращает **отсортированный** список всех затронутых — изменённых и всех, кто от них зависит прямо или транзитивно. Именно эти проекты нужно пересобрать и протестировать в CI.`,
    starter: `type ProjectGraph = Record<string, string[]>;

function affected(graph: ProjectGraph, changed: string[]): string[] {
  return [...changed].sort();
}
`,
    solution: `type ProjectGraph = Record<string, string[]>;

function affected(graph: ProjectGraph, changed: string[]): string[] {
  const dependents = new Map<string, string[]>();
  for (const [project, deps] of Object.entries(graph)) {
    for (const dep of deps) {
      dependents.set(dep, [...(dependents.get(dep) ?? []), project]);
    }
  }
  const result = new Set<string>();
  const queue = [...changed];
  while (queue.length > 0) {
    const project = queue.shift()!;
    if (result.has(project)) continue;
    result.add(project);
    queue.push(...(dependents.get(project) ?? []));
  }
  return [...result].sort();
}
`,
    tests: [
      { name: 'изменение util затрагивает всех потребителей', code: `const graph = {
  shop: ['feature-cart', 'feature-catalog'],
  admin: ['feature-users'],
  'feature-cart': ['data-access', 'ui'],
  'feature-catalog': ['ui'],
  'feature-users': ['ui'],
  'data-access': ['util'],
  ui: ['util'],
  util: [],
};
expect(affected(graph, ['data-access'])).toEqual(['data-access', 'feature-cart', 'shop']);
expect(affected(graph, ['util'])).toEqual(['admin', 'data-access', 'feature-cart', 'feature-catalog', 'feature-users', 'shop', 'ui', 'util']);` },
      { name: 'изменение приложения затрагивает только его', code: `expect(affected({ shop: ['ui'], admin: ['ui'], ui: [] }, ['admin'])).toEqual(['admin']);` },
      { name: 'несколько изменений и отсутствие дублей', code: `const graph = { app: ['a', 'b'], a: [], b: [] };
expect(affected(graph, ['a', 'b'])).toEqual(['a', 'app', 'b']);` },
    ],
    hints: ['Постройте обратный граф: зависимость → кто от неё зависит.', 'Обход в ширину от изменённых проектов по обратному графу.'],
  },
  {
    id: 'build-semver',
    trackId: 'tooling',
    title: 'Совместимость версий для shared-зависимостей',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'module-federation',
    description: `Module Federation решает, можно ли переиспользовать уже загруженную shared-зависимость, проверяя её версию по диапазону \`requiredVersion\`. Напишите \`satisfies(version, range)\` для упрощённого semver (только \`MAJOR.MINOR.PATCH\`, без пререлизов):

- точная версия \`'22.1.0'\`;
- \`^\` — совместимые изменения: \`^22.1.0\` = \`>=22.1.0 <23.0.0\`; для нулевой мажорной \`^0.4.2\` = \`>=0.4.2 <0.5.0\`;
- \`~\` — патчи: \`~22.1.0\` = \`>=22.1.0 <22.2.0\`;
- \`>=\` — не меньше указанной.`,
    starter: `function satisfies(version: string, range: string): boolean {
  return version === range;
}
`,
    solution: `type Version = [number, number, number];

const parse = (v: string): Version => {
  const parts = v.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
};

const compare = (a: Version, b: Version): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function satisfies(version: string, range: string): boolean {
  const v = parse(version);
  if (range.startsWith('>=')) return compare(v, parse(range.slice(2))) >= 0;
  if (range.startsWith('^')) {
    const min = parse(range.slice(1));
    const max: Version = min[0] > 0 ? [min[0] + 1, 0, 0] : [0, min[1] + 1, 0];
    return compare(v, min) >= 0 && compare(v, max) < 0;
  }
  if (range.startsWith('~')) {
    const min = parse(range.slice(1));
    return compare(v, min) >= 0 && compare(v, [min[0], min[1] + 1, 0]) < 0;
  }
  return compare(v, parse(range)) === 0;
}
`,
    tests: [
      { name: 'caret', code: `expect(satisfies('22.2.3', '^22.1.0')).toBe(true);
expect(satisfies('22.0.9', '^22.1.0')).toBe(false);
expect(satisfies('23.0.0', '^22.1.0')).toBe(false);` },
      { name: 'caret для 0.x', code: `expect(satisfies('0.4.9', '^0.4.2')).toBe(true);
expect(satisfies('0.5.0', '^0.4.2')).toBe(false);` },
      { name: 'tilde', code: `expect(satisfies('22.1.7', '~22.1.0')).toBe(true);
expect(satisfies('22.2.0', '~22.1.0')).toBe(false);` },
      { name: 'точная и >=', code: `expect(satisfies('7.8.2', '7.8.2')).toBe(true);
expect(satisfies('7.8.1', '7.8.2')).toBe(false);
expect(satisfies('10.0.0', '>=9.1.0')).toBe(true);
expect(satisfies('9.0.9', '>=9.1.0')).toBe(false);
expect(satisfies('22.10.0', '^22.9.0')).toBe(true);` },
    ],
    hints: ['Сравнивайте версии как кортежи чисел, а не как строки: "22.10.0" больше "22.9.0".'],
  },
  {
    id: 'mcp-tool-dispatcher',
    trackId: 'ai-mcp',
    title: 'Мини MCP-сервер: tools/list и tools/call',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'mcp-architecture',
    description: `Реализуйте ядро MCP-сервера — обработчик JSON-RPC сообщений \`createServer()\` с методами \`registerTool(definition, handler)\` и \`handle(message)\`:

- \`tools/list\` → \`{ jsonrpc: '2.0', id, result: { tools: [{ name, description, inputSchema }] } }\` в порядке регистрации;
- \`tools/call\` с \`params: { name, arguments }\`:
  - проверяет обязательные поля из \`inputSchema.required\` и типы \`string\`/\`number\`/\`boolean\` из \`inputSchema.properties\`; при ошибке аргументов — результат \`{ content: [{ type: 'text', text: 'Invalid arguments: ...' }], isError: true }\` (это ошибка выполнения, её должна увидеть модель);
  - исключение обработчика — тоже \`isError: true\` с текстом ошибки;
  - успех — \`{ content: [{ type: 'text', text: <строка от обработчика> }], isError: false }\`;
- неизвестный инструмент → JSON-RPC ошибка \`{ error: { code: -32602, message } }\`;
- неизвестный метод → \`{ error: { code: -32601, message: 'Method not found' } }\`.`,
    starter: `type JsonSchema = {
  type: 'object';
  properties: Record<string, { type: 'string' | 'number' | 'boolean'; description?: string }>;
  required?: string[];
};
type ToolDefinition = { name: string; description: string; inputSchema: JsonSchema };
type Request = { jsonrpc: '2.0'; id: number; method: string; params?: any };

function createServer() {
  return {
    registerTool(definition: ToolDefinition, handler: (args: any) => Promise<string> | string): void {},
    async handle(message: Request): Promise<unknown> {
      return null;
    },
  };
}
`,
    solution: `type JsonSchema = {
  type: 'object';
  properties: Record<string, { type: 'string' | 'number' | 'boolean'; description?: string }>;
  required?: string[];
};
type ToolDefinition = { name: string; description: string; inputSchema: JsonSchema };
type Request = { jsonrpc: '2.0'; id: number; method: string; params?: any };
type Handler = (args: any) => Promise<string> | string;

const validate = (schema: JsonSchema, args: Record<string, unknown>): string | null => {
  for (const field of schema.required ?? []) {
    if (args[field] === undefined) return 'missing "' + field + '"';
  }
  for (const [field, value] of Object.entries(args)) {
    const expected = schema.properties[field]?.type;
    if (expected && typeof value !== expected) return '"' + field + '" must be ' + expected;
  }
  return null;
};

const textResult = (text: string, isError: boolean) => ({ content: [{ type: 'text', text }], isError });

function createServer() {
  const tools = new Map<string, { definition: ToolDefinition; handler: Handler }>();

  return {
    registerTool(definition: ToolDefinition, handler: Handler): void {
      tools.set(definition.name, { definition, handler });
    },

    async handle(message: Request): Promise<unknown> {
      const reply = (body: object) => ({ jsonrpc: '2.0', id: message.id, ...body });

      if (message.method === 'tools/list') {
        const list = [...tools.values()].map(({ definition }) => ({ ...definition }));
        return reply({ result: { tools: list } });
      }

      if (message.method === 'tools/call') {
        const tool = tools.get(message.params?.name);
        if (!tool) return reply({ error: { code: -32602, message: 'Unknown tool: ' + message.params?.name } });
        const args = message.params?.arguments ?? {};
        const problem = validate(tool.definition.inputSchema, args);
        if (problem) return reply({ result: textResult('Invalid arguments: ' + problem, true) });
        try {
          return reply({ result: textResult(await tool.handler(args), false) });
        } catch (error) {
          return reply({ result: textResult(error instanceof Error ? error.message : String(error), true) });
        }
      }

      return reply({ error: { code: -32601, message: 'Method not found' } });
    },
  };
}
`,
    tests: [
      { name: 'tools/list', code: `const server = createServer();
server.registerTool({ name: 'echo', description: 'Повторяет текст', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } }, (a) => a.text);
const res = await server.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
expect(res.id).toBe(1);
expect(res.result.tools.map((t) => t.name)).toEqual(['echo']);
expect(res.result.tools[0].inputSchema.required).toEqual(['text']);` },
      { name: 'tools/call: успех', code: `const server = createServer();
server.registerTool({ name: 'add', description: 'Сумма', inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] } }, (x) => String(x.a + x.b));
const res = await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'add', arguments: { a: 2, b: 3 } } });
expect(res.result).toEqual({ content: [{ type: 'text', text: '5' }], isError: false });` },
      { name: 'ошибки аргументов и обработчика — isError', code: `const server = createServer();
server.registerTool({ name: 'add', description: '', inputSchema: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'] } }, () => { throw new Error('сервис недоступен'); });
const missing = await server.handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'add', arguments: {} } });
expect(missing.result.isError).toBe(true);
expect(missing.result.content[0].text).toContain('Invalid arguments');
const wrongType = await server.handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'add', arguments: { a: 'два' } } });
expect(wrongType.result.isError).toBe(true);
const failed = await server.handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'add', arguments: { a: 1 } } });
expect(failed.result).toEqual({ content: [{ type: 'text', text: 'сервис недоступен' }], isError: true });` },
      { name: 'ошибки протокола', code: `const server = createServer();
const unknownTool = await server.handle({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'nope', arguments: {} } });
expect(unknownTool.error.code).toBe(-32602);
const unknownMethod = await server.handle({ jsonrpc: '2.0', id: 7, method: 'resources/whatever' });
expect(unknownMethod).toEqual({ jsonrpc: '2.0', id: 7, error: { code: -32601, message: 'Method not found' } });` },
    ],
    hints: [
      'Храните инструменты в Map по имени — это и порядок регистрации для tools/list.',
      'Ошибки выполнения инструмента — это result с isError: true, а не JSON-RPC error: так модель увидит проблему и сможет исправиться.',
    ],
  },
] as const satisfies readonly Exercise[];
