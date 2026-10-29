import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LEVEL_LABELS, type Level } from '../../domain/catalog.model';

/** Difficulty shown as filled bars plus a label, so it never relies on colour alone. */
@Component({
  selector: 'app-level-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-1.5 text-xs text-muted' },
  template: `
    <span class="flex items-end gap-[2px]" aria-hidden="true">
      @for (bar of bars; track bar) {
        <span
          class="w-[3px] rounded-sm"
          [style.height.px]="4 + bar * 3"
          [class]="bar < filled() ? 'bg-ink' : 'bg-line'"
        ></span>
      }
    </span>
    <span>{{ label() }}</span>
  `,
})
export class LevelBadge {
  readonly level = input.required<Level>();

  protected readonly bars = [0, 1, 2] as const;
  protected readonly label = computed(() => LEVEL_LABELS[this.level()]);
  protected readonly filled = computed(() => {
    const level = this.level();
    return level === 'basic' ? 1 : level === 'middle' ? 2 : 3;
  });
}
