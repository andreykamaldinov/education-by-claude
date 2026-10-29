import type { Track } from '../../domain/catalog.model';

export const OOP_SOLID_TRACK = {
  id: 'oop-solid',
  title: 'ООП и SOLID',
  short: 'OOP',
  description:
    'Принципы, на которых держится поддерживаемый код: инкапсуляция, наследование, полиморфизм, абстракция, пять принципов SOLID, DRY, KISS, YAGNI.',
  accent: '#6A4FB5',
  onAccent: '#FFFFFF',
  status: 'ready',
  sections: [
    {
      id: 'oop',
      title: 'Объектно-ориентированное программирование',
      lessons: [
        {
          id: 'oop-principles',
          title: 'Четыре принципа ООП',
          summary: 'Инкапсуляция, наследование, полиморфизм и абстракция на примерах TypeScript.',
          level: 'basic',
          minutes: 13,
          tags: ['инкапсуляция', 'полиморфизм', 'абстракция'],
        },
        {
          id: 'classes-ts',
          title: 'Классы в TypeScript',
          summary: 'Модификаторы доступа, #private, abstract, implements, статические члены и parameter properties.',
          level: 'basic',
          minutes: 10,
          tags: ['class', 'abstract', 'private', 'implements'],
        },
        {
          id: 'composition',
          title: 'Композиция против наследования',
          summary: 'Почему глубокие иерархии ломаются и как собирать поведение из частей.',
          level: 'middle',
          minutes: 10,
          tags: ['composition', 'inheritance', 'mixins'],
        },
      ],
    },
    {
      id: 'solid',
      title: 'SOLID',
      lessons: [
        {
          id: 'srp',
          title: 'S — Single Responsibility',
          summary: 'Одна причина для изменения: как делить сервисы и компоненты.',
          level: 'basic',
          minutes: 8,
          tags: ['SRP', 'SOLID'],
        },
        {
          id: 'ocp',
          title: 'O — Open/Closed',
          summary: 'Расширение без изменения: стратегии, токены и multi-провайдеры.',
          level: 'middle',
          minutes: 8,
          tags: ['OCP', 'SOLID'],
        },
        {
          id: 'lsp',
          title: 'L — Liskov Substitution',
          summary: 'Подтип должен вести себя как базовый тип: квадрат, прямоугольник и контракты.',
          level: 'middle',
          minutes: 8,
          tags: ['LSP', 'SOLID'],
        },
        {
          id: 'isp',
          title: 'I — Interface Segregation',
          summary: 'Маленькие специализированные контракты вместо «толстых» интерфейсов.',
          level: 'basic',
          minutes: 7,
          tags: ['ISP', 'SOLID'],
        },
        {
          id: 'dip',
          title: 'D — Dependency Inversion',
          summary: 'Зависимость от абстракций, DI-контейнер Angular и InjectionToken.',
          level: 'middle',
          minutes: 9,
          tags: ['DIP', 'SOLID', 'DI'],
        },
      ],
    },
    {
      id: 'principles',
      title: 'Принципы чистого кода',
      lessons: [
        {
          id: 'dry-kiss-yagni',
          title: 'DRY, KISS, YAGNI и закон Деметры',
          summary: 'Принципы, которые чаще всего упоминают на ревью, и когда их нарушать.',
          level: 'basic',
          minutes: 9,
          tags: ['DRY', 'KISS', 'YAGNI', 'Law of Demeter'],
        },
      ],
    },
  ],
} as const satisfies Track;
