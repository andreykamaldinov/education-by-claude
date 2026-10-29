import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
      <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Карта всех тем</h1>
      <p class="mt-3 max-w-[64ch] text-muted">
        {{ catalog.lessons.length }} уроков в {{ catalog.tracks.length }} треках. Отмеченные галочкой вы уже прошли.
      </p>

      <div class="mt-10 space-y-6">
        @for (track of catalog.tracks; track track.id) {
          <section
            class="overflow-hidden rounded-2xl border border-line bg-surface"
            [attr.aria-labelledby]="'catalog-' + track.id"
          >
            <header class="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4">
              <span class="h-10 w-2 rounded-full" [style.background]="track.accent"></span>
              <div class="min-w-0 flex-1">
                <h2 [id]="'catalog-' + track.id" class="font-display text-lg font-semibold">
                  <a [routerLink]="['/tracks', track.id]" class="hover:underline">{{ track.title }}</a>
                </h2>
                <p class="text-sm text-muted">{{ track.description }}</p>
              </div>
              <span class="text-sm text-muted">
                {{ progress.completedInTrack(track.id) }} / {{ catalog.lessonsOf(track.id).length }}
              </span>
            </header>
            <div class="grid gap-x-8 gap-y-6 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
              @for (section of track.sections; track section.id) {
                <div>
                  <h3 class="text-sm font-semibold text-muted">{{ section.title }}</h3>
                  <ul class="mt-2 space-y-1">
                    @for (lesson of section.lessons; track lesson.id) {
                      <li>
                        <a
                          [routerLink]="['/tracks', track.id, lesson.id]"
                          class="flex items-start gap-2 rounded-md py-1 hover:text-link"
                        >
                          @if (progress.isLessonCompleted(track.id, lesson.id)) {
                            <app-icon name="check" [size]="16" class="mt-1 text-ok" />
                          } @else {
                            <span class="mt-[9px] ml-[5px] mr-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-line"></span>
                          }
                          <span>{{ lesson.title }}</span>
                        </a>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
})
export class CatalogPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly progress = inject(ProgressService);
}
