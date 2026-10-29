import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';
import type { RuntimeLanguage } from '../../domain/exercise.model';

/** Colours come from CSS variables, so the editor follows the light/dark theme automatically. */
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'var(--c-code-bg)',
    color: 'var(--c-code-ink)',
  },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
  '.cm-content': { padding: '12px 0', caretColor: 'var(--c-ink)' },
  '.cm-gutters': {
    backgroundColor: 'var(--c-code-bg)',
    color: 'var(--c-muted)',
    border: 'none',
    paddingLeft: '6px',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--c-ink) 5%, transparent)',
  },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--c-ink)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--track) 28%, transparent) !important',
  },
});

@Component({
  selector: 'app-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full overflow-hidden' },
  template: '',
})
export class CodeEditor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private view: EditorView | undefined;

  readonly code = model.required<string>();
  readonly language = input<RuntimeLanguage>('typescript');
  readonly ariaLabel = input('Редактор кода');
  readonly runRequested = output<void>();

  constructor() {
    afterNextRender(() => this.createView());

    // Push external changes (reset, show solution) into the editor without fighting the user's typing.
    effect(() => {
      const next = this.code();
      const view = this.view;
      if (view && view.state.doc.toString() !== next) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } });
      }
    });

    this.destroyRef.onDestroy(() => this.view?.destroy());
  }

  private createView(): void {
    const runKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          this.runRequested.emit();
          return true;
        },
      },
    ]);

    this.view = new EditorView({
      parent: this.host.nativeElement,
      state: EditorState.create({
        doc: this.code(),
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          indentUnit.of('  '),
          EditorState.tabSize.of(2),
          runKeymap,
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          javascript({ typescript: this.language() === 'typescript' }),
          syntaxHighlighting(classHighlighter),
          editorTheme,
          EditorView.contentAttributes.of({ 'aria-label': this.ariaLabel() }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              this.code.set(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
  }
}
