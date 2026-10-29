import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RunResult } from '../../domain/exercise.model';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-run-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block', 'aria-live': 'polite' },
  template: `
    @switch (result().kind) {
      @case ('completed') {
        <p class="flex items-center gap-2 font-medium" [class]="allPassed() ? 'text-ok' : 'text-bad'">
          <app-icon [name]="allPassed() ? 'check' : 'close'" [strokeWidth]="2.4" />
          @if (allPassed()) {
            Все тесты пройдены
          } @else {
            Пройдено {{ passedCount() }} из {{ tests().length }}
          }
          <span class="ml-auto text-xs font-normal text-muted">{{ duration() }} мс</span>
        </p>
        <ul class="mt-3 space-y-1.5">
          @for (test of tests(); track $index) {
            <li class="rounded-lg px-3 py-2 text-sm" [class]="test.status === 'passed' ? 'bg-ok/8' : 'bg-bad/8'">
              <span class="flex items-start gap-2">
                <app-icon
                  [name]="test.status === 'passed' ? 'check' : 'close'"
                  [size]="15"
                  [strokeWidth]="2.4"
                  [class]="test.status === 'passed' ? 'mt-0.5 text-ok' : 'mt-0.5 text-bad'"
                />
                <span>{{ test.name }}</span>
              </span>
              @if (test.status === 'failed') {
                <span class="mt-1 block pl-6 font-mono text-xs break-words text-bad">{{ test.message }}</span>
              }
            </li>
          }
        </ul>
      }
      @case ('compile-error') {
        <p class="flex items-center gap-2 font-medium text-bad"><app-icon name="close" [strokeWidth]="2.4" /> Код не запустился</p>
        <pre class="mt-3 overflow-x-auto rounded-lg bg-bad/8 p-3 font-mono text-xs whitespace-pre-wrap text-bad">{{ errorMessage() }}</pre>
      }
      @case ('timeout') {
        <p class="flex items-center gap-2 font-medium text-bad"><app-icon name="clock" /> Выполнение прервано</p>
        <p class="mt-2 text-sm text-muted">
          Код работал дольше {{ timeoutSeconds() }} с — похоже на бесконечный цикл или промис, который никогда не завершается.
        </p>
      }
    }

    @if (logs().length > 0) {
      <div class="mt-4">
        <p class="text-xs font-semibold text-muted">Консоль</p>
        <pre class="mt-1.5 max-h-48 overflow-auto rounded-lg bg-sunken p-3 font-mono text-xs leading-relaxed">@for (line of logs(); track $index) {<span [class.text-bad]="line.level === 'error'" [class.italic]="line.level === 'warn'">{{ line.text }}
</span>}</pre>
      </div>
    }
  `,
})
export class RunReport {
  readonly result = input.required<RunResult>();

  protected readonly tests = computed(() => {
    const result = this.result();
    return result.kind === 'completed' ? result.tests : [];
  });
  protected readonly passedCount = computed(() => this.tests().filter((test) => test.status === 'passed').length);
  protected readonly allPassed = computed(() => this.passedCount() === this.tests().length);
  protected readonly duration = computed(() => {
    const result = this.result();
    return result.kind === 'completed' ? result.durationMs : 0;
  });
  protected readonly errorMessage = computed(() => {
    const result = this.result();
    return result.kind === 'compile-error' ? result.message : '';
  });
  protected readonly timeoutSeconds = computed(() => {
    const result = this.result();
    return result.kind === 'timeout' ? result.limitMs / 1000 : 0;
  });
  protected readonly logs = computed(() => {
    const result = this.result();
    return result.kind === 'timeout' ? [] : result.logs;
  });
}
