import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let search: SearchService;

  beforeEach(() => {
    search = TestBed.inject(SearchService);
  });

  it('shows tracks when the query is empty', () => {
    search.query.set('');
    expect(search.hits().every((hit) => hit.kind === 'track')).toBe(true);
  });

  it('finds lessons by tag and ranks title matches first', () => {
    search.query.set('switchMap');

    const [first] = search.hits();
    expect(first?.url).toBe('/tracks/rxjs/higher-order');
  });

  it('requires every word to match and ignores ё/е differences', () => {
    search.query.set('замыкания javascript');
    expect(search.hits().some((hit) => hit.url === '/tracks/javascript/closures')).toBe(true);

    search.query.set('ещё несуществующее слово');
    expect(search.hits()).toEqual([]);
  });

  it('finds practice exercises', () => {
    search.query.set('debounce');
    expect(search.hits().some((hit) => hit.kind === 'exercise' && hit.url === '/practice/js-debounce')).toBe(true);
  });
});
