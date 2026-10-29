Напишем MCP-сервер на TypeScript с официальным SDK v2: инструмент поиска по урокам, ресурс с содержимым урока и шаблон промпта. Сервер будет работать локально через stdio — так его можно подключить к IDE или Claude.

## Установка

```bash
mkdir lessons-mcp && cd lessons-mcp
npm init -y
npm install @modelcontextprotocol/server zod
npm install -D typescript @types/node tsx
```

```json
// package.json
{ "type": "module", "bin": { "lessons-mcp": "dist/index.js" } }
```

```json
// tsconfig.json — TypeScript 6 не подключает @types автоматически
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "types": ["node"]
  }
}
```

SDK v2 требует Zod 4 (или другую библиотеку, поддерживающую Standard Schema): из схемы автоматически генерируется JSON Schema для описания инструмента, а аргументы валидируются перед вызовом обработчика.

## Сервер

```ts
// src/server.ts
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';

type Lesson = { id: string; track: string; title: string; tags: string[] };

const LESSONS: Lesson[] = [
  { id: 'closures', track: 'javascript', title: 'Замыкания', tags: ['closure', 'scope'] },
  { id: 'higher-order', track: 'rxjs', title: 'switchMap, mergeMap, concatMap, exhaustMap', tags: ['switchMap'] },
];

export function createServer(): McpServer {
  const server = new McpServer({ name: 'lessons-mcp', version: '1.0.0' });

  // Tool: модель вызывает, когда нужно найти урок
  server.registerTool(
    'search_lessons',
    {
      title: 'Поиск по урокам',
      description:
        'Ищет уроки по ключевым словам в названии и тегах. Используй, когда пользователь спрашивает о теме фронтенд-разработки и нужно найти учебный материал.',
      inputSchema: z.object({
        query: z.string().min(2).describe('Ключевые слова, например «switchMap» или «замыкания»'),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      outputSchema: z.object({
        lessons: z.array(z.object({ id: z.string(), track: z.string(), title: z.string() })),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, limit }) => {
      const words = query.toLowerCase().split(/\s+/);
      const lessons = LESSONS.filter((lesson) =>
        words.some((w) => lesson.title.toLowerCase().includes(w) || lesson.tags.some((t) => t.includes(w))),
      )
        .slice(0, limit)
        .map(({ id, track, title }) => ({ id, track, title }));

      return {
        content: [{ type: 'text', text: lessons.length ? JSON.stringify(lessons) : 'Ничего не найдено' }],
        structuredContent: { lessons },
      };
    },
  );

  // Resource: содержимое урока по URI-шаблону lesson://{track}/{id}
  server.registerResource(
    'lesson',
    new ResourceTemplate('lesson://{track}/{id}', { list: undefined }),
    { title: 'Текст урока', mimeType: 'text/markdown' },
    async (uri, { track, id }) => ({
      contents: [{ uri: uri.href, text: await readFile(`content/${track}/${id}.md`, 'utf8') }],
    }),
  );

  // Prompt: шаблон, который пользователь выбирает в интерфейсе
  server.registerPrompt(
    'quiz_me',
    {
      title: 'Проверь мои знания',
      description: 'Задать 5 вопросов по теме, как на собеседовании',
      argsSchema: z.object({ topic: z.string().describe('Тема, например «change detection»') }),
    },
    async ({ topic }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: `Задай мне 5 вопросов уровня middle по теме «${topic}». После каждого ответа объясняй ошибки.` },
        },
      ],
    }),
  );

  return server;
}
```

> [!NOTE]
> Серверы на SDK v1 (`@modelcontextprotocol/sdk`, метод `server.tool()`) мигрируют на v2 codemod-ом `npx @modelcontextprotocol/codemod v1-to-v2 .`: он переименовывает методы и переносит импорты. Схемы в v2 передаются целиком (`z.object({...})`), а не объектом полей.

## Точка входа: stdio

```ts
// src/index.ts
#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.js';

serveStdio(() => createServer()); // фабрика: SDK сам решает, какую «эпоху» протокола обслуживать
```

> [!WARNING]
> В stdio-сервере **нельзя писать в stdout** ничего, кроме сообщений протокола: `console.log` сломает обмен. Логируйте в stderr (`console.error`).

## Удалённый сервер: Streamable HTTP

В v2 сервер создаётся **на каждый запрос** (протокол stateless), а адаптеры фреймворков подключают обработчик:

```ts
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';

const app = createMcpExpressApp({ allowedHosts: ['localhost', 'mcp.example.com'] }); // защита от DNS rebinding
const handler = toNodeHandler(createMcpHandler(() => createServer()));

app.all('/mcp', (req, res) => void handler(req, res, req.body));
app.listen(3000);
```

Для продакшена добавьте OAuth 2.1 (MCP-сервер как ресурс-сервер), rate limiting и логирование.

## Подключение к клиенту

```json
// .vscode/mcp.json (VS Code) или конфигурация вашего AI-клиента
{
  "servers": {
    "lessons": { "command": "npx", "args": ["tsx", "src/index.ts"] }
  }
}
```

Для отладки используйте **MCP Inspector** (`npx @modelcontextprotocol/inspector`) — он показывает список инструментов, позволяет вызвать их вручную и видеть сообщения протокола.

## Советы по проектированию инструментов

- **Инструменты под задачи**, а не обёртки над каждым эндпоинтом: `find_failing_tests` полезнее, чем `list_files` + `read_file` + `run_command`.
- **Описания** — конкретные: когда использовать, что вернётся, примеры аргументов.
- **Малые и структурированные ответы**: модель платит контекстом за каждый символ. Пагинация, фильтры, `structuredContent`.
- **Понятные ошибки** с `isError: true` и подсказкой, что исправить.
- **Аннотации** честные: `readOnlyHint: true` только для действительно безопасных операций.
- **Идемпотентность** там, где возможно — модель может повторить вызов.

> [!INTERVIEW]
> «Как написать свой MCP-сервер?» — С официальным SDK: создать `McpServer`, зарегистрировать инструменты через `registerTool` со схемой входа (Zod), описанием для модели и обработчиком, при необходимости ресурсы и промпты, затем подключить транспорт — stdio для локального сервера или Streamable HTTP через адаптер для удалённого. Важно писать понятные описания, возвращать компактные структурированные результаты, не писать в stdout в stdio-режиме и защищать удалённый сервер авторизацией.

## Коротко

- SDK v2: пакеты `@modelcontextprotocol/server` (+ адаптеры `express`, `node`), Zod 4.
- `registerTool` / `registerResource` / `registerPrompt` — регистрация возможностей.
- stdio: `serveStdio(factory)`; не пишите в stdout.
- HTTP: `createMcpHandler(factory)` — сервер на запрос, stateless.
- Отладка — MCP Inspector; проектируйте инструменты под задачи пользователя.
