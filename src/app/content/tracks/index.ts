import type { Track } from '../../domain/catalog.model';
import { AI_MCP_TRACK } from './ai-mcp.track';
import { ANGULAR_TRACK } from './angular.track';
import { ARCHITECTURE_TRACK } from './architecture.track';
import { JAVASCRIPT_TRACK } from './javascript.track';
import { OOP_SOLID_TRACK } from './oop-solid.track';
import { PATTERNS_TRACK } from './patterns.track';
import { RXJS_TRACK } from './rxjs.track';
import { SECURITY_TRACK } from './security.track';
import { TOOLING_TRACK } from './tooling.track';
import { TYPESCRIPT_TRACK } from './typescript.track';
import { WEB_PLATFORM_TRACK } from './web-platform.track';

/**
 * The single registry of tracks, in the recommended study order.
 * To add a new language or topic: create `<id>.track.ts`, put lessons into
 * `public/content/<id>/`, and append the track here.
 */
export const TRACKS: readonly Track[] = [
  JAVASCRIPT_TRACK,
  TYPESCRIPT_TRACK,
  ANGULAR_TRACK,
  RXJS_TRACK,
  WEB_PLATFORM_TRACK,
  SECURITY_TRACK,
  OOP_SOLID_TRACK,
  PATTERNS_TRACK,
  ARCHITECTURE_TRACK,
  TOOLING_TRACK,
  AI_MCP_TRACK,
];

/** Tracks announced on the shelf but not written yet. */
export const PLANNED_TRACKS: readonly Track[] = [
  {
    id: 'node',
    title: 'Node.js',
    short: 'Node',
    description: 'Серверный JavaScript: event loop libuv, стримы, NestJS.',
    accent: '#7A8C74',
    onAccent: '#FFFFFF',
    status: 'planned',
    sections: [],
  },
  {
    id: 'python',
    title: 'Python',
    short: 'Py',
    description: 'Второй язык платформы.',
    accent: '#8B8F99',
    onAccent: '#FFFFFF',
    status: 'planned',
    sections: [],
  },
];
