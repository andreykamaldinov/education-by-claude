import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../core/progress/progress.service';
import type { Track } from '../../domain/catalog.model';

const MIN_SPINE_HEIGHT = 190;
const HEIGHT_PER_LESSON = 9;
const MAX_SPINE_HEIGHT = 380;
/** Space taken by the label, divider and counter around the vertical title. */
const SPINE_CHROME = 118;
const PX_PER_TITLE_CHAR = 8.4;

type Spine = {
  readonly track: Track;
  readonly lessons: number;
  readonly completed: number;
  readonly height: number;
};

/**
 * Tracks drawn as book spines on a shelf. Spine height reflects how much material
 * a track holds; the filled strip at the bottom shows the learner's progress.
 */
@Component({
  selector: 'app-track-shelf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: `
    .spine {
      transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .spine:hover,
    .spine:focus-visible {
      transform: translateY(-8px);
    }
    .spine-title {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }
  `,
  template: `
    <div class="overflow-x-auto pb-1">
      <ul class="flex min-w-max items-end gap-2 border-b-[6px] border-ink/80 px-1 sm:gap-3" aria-label="Треки">
        @for (spine of spines(); track spine.track.id) {
          <li>
            <a
              class="spine relative flex w-[58px] flex-col items-center overflow-hidden rounded-t-md pt-3 sm:w-[66px]"
              [routerLink]="['/tracks', spine.track.id]"
              [style.height.px]="spine.height"
              [style.background]="spine.track.accent"
              [style.color]="spine.track.onAccent"
              [attr.aria-label]="spine.track.title + ': пройдено ' + spine.completed + ' из ' + spine.lessons"
            >
              <span class="font-display text-[13px] font-semibold">{{ spine.track.short }}</span>
              <span class="mt-2 h-px w-8 bg-current opacity-40"></span>
              <span class="spine-title mt-3 flex-1 overflow-hidden text-[15px] font-semibold whitespace-nowrap">
                {{ spine.track.title }}
              </span>
              <span class="mb-2 text-[11px] opacity-80">{{ spine.completed }}/{{ spine.lessons }}</span>
              <span
                class="absolute bottom-0 left-0 h-1.5 bg-current opacity-60"
                [style.width.%]="spine.lessons ? (spine.completed / spine.lessons) * 100 : 0"
              ></span>
            </a>
          </li>
        }
        @for (track of planned(); track track.id) {
          <li>
            <div
              class="flex h-[170px] w-[58px] flex-col items-center rounded-t-md border-2 border-b-0 border-dashed border-line pt-3 text-muted sm:w-[66px]"
              [attr.aria-label]="track.title + ': в планах'"
            >
              <span class="font-display text-[13px] font-semibold">{{ track.short }}</span>
              <span class="spine-title mt-3 flex-1 text-[14px] font-medium whitespace-nowrap">{{ track.title }}</span>
              <span class="mb-2 text-[11px]">скоро</span>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class TrackShelf {
  private readonly progress = inject(ProgressService);

  readonly tracks = input.required<readonly Track[]>();
  readonly planned = input<readonly Track[]>([]);

  protected readonly spines = computed<readonly Spine[]>(() =>
    this.tracks().map((track) => {
      const lessons = track.sections.reduce((sum, section) => sum + section.lessons.length, 0);
      return {
        track,
        lessons,
        completed: this.progress.completedInTrack(track.id),
        height: Math.max(
          Math.min(MAX_SPINE_HEIGHT, MIN_SPINE_HEIGHT + lessons * HEIGHT_PER_LESSON),
          SPINE_CHROME + track.title.length * PX_PER_TITLE_CHAR,
        ),
      };
    }),
  );
}
