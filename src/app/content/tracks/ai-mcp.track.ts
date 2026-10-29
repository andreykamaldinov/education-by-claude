import type { Track } from '../../domain/catalog.model';

export const AI_MCP_TRACK = {
  id: 'ai-mcp',
  title: 'AI-инструменты и MCP',
  short: 'MCP',
  description:
    'Model Context Protocol: как AI-ассистенты подключаются к инструментам и данным, как написать свой MCP-сервер и что умеет Angular CLI MCP.',
  accent: '#00838F',
  onAccent: '#FFFFFF',
  status: 'ready',
  sections: [
    {
      id: 'mcp',
      title: 'Model Context Protocol',
      lessons: [
        {
          id: 'mcp-intro',
          title: 'Что такое MCP и зачем он нужен',
          summary: 'Проблема N×M интеграций, открытый стандарт и где MCP уже используется.',
          level: 'basic',
          minutes: 8,
          tags: ['MCP', 'LLM', 'AI'],
        },
        {
          id: 'mcp-architecture',
          title: 'Архитектура MCP',
          summary: 'Host, client, server; tools, resources, prompts; JSON-RPC, stdio и Streamable HTTP.',
          level: 'middle',
          minutes: 12,
          tags: ['tools', 'resources', 'prompts', 'JSON-RPC'],
        },
        {
          id: 'mcp-server-ts',
          title: 'Пишем MCP-сервер на TypeScript',
          summary: 'Официальный SDK, регистрация инструмента со схемой zod, подключение к клиенту.',
          level: 'middle',
          minutes: 13,
          tags: ['SDK', 'TypeScript', 'zod'],
        },
        {
          id: 'angular-cli-mcp',
          title: 'Angular CLI MCP и AI в разработке',
          summary: 'ng mcp, best practices для AI, llms.txt и правила для ассистентов в проекте.',
          level: 'basic',
          minutes: 8,
          tags: ['ng mcp', 'Angular CLI', 'AI'],
        },
        {
          id: 'mcp-security',
          title: 'Безопасность MCP',
          summary: 'Prompt injection, отравление инструментов, права доступа и подтверждение действий.',
          level: 'advanced',
          minutes: 9,
          tags: ['prompt injection', 'security'],
        },
      ],
    },
  ],
} as const satisfies Track;
