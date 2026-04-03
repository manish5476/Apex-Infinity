import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  ViewChild,
  signal,
  HostListener,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simple-editor',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SimpleEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './simple-editor.component.html',
  styleUrl: './simple-editor.component.scss',
})
export class SimpleEditorComponent implements ControlValueAccessor {
  @Input() placeholder = 'Start writing…';
  @Input() minHeight = '320px';
  @Output() wordCount = new EventEmitter<number>();

  @ViewChild('editorRef') editorRef!: ElementRef<HTMLTextAreaElement>;

  value = signal('');
  isFocused = signal(false);
  activeFormats = signal<Set<string>>(new Set());

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ── Toolbar actions ──────────────────────────────────────
  readonly tools: { id: string; icon: string; label: string; action: () => void }[] = [
    { id: 'bold',      icon: 'B',   label: 'Bold',          action: () => this.wrap('**', '**', 'bold text') },
    { id: 'italic',    icon: 'I',   label: 'Italic',        action: () => this.wrap('_', '_', 'italic text') },
    { id: 'h1',        icon: 'H1',  label: 'Heading 1',     action: () => this.prefixLine('# ') },
    { id: 'h2',        icon: 'H2',  label: 'Heading 2',     action: () => this.prefixLine('## ') },
    { id: 'ul',        icon: '•—',  label: 'Bullet list',   action: () => this.prefixLine('- ') },
    { id: 'ol',        icon: '1.',  label: 'Ordered list',  action: () => this.prefixLine('1. ') },
    { id: 'code',      icon: '</>',  label: 'Inline code',   action: () => this.wrap('`', '`', 'code') },
    { id: 'hr',        icon: '—',   label: 'Divider',       action: () => this.insertText('\n---\n') },
  ];

  // ── ControlValueAccessor ─────────────────────────────────
  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.disabled = isDisabled;
    }
  }

  // ── Textarea events ──────────────────────────────────────
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const text = textarea.value;
    this.value.set(text);
    this.onChange(text);
    this.autoResize(textarea);
    this.emitWordCount(text);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  private emitWordCount(text: string): void {
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.wordCount.emit(count);
  }

  private autoResize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // ── Toolbar helpers ──────────────────────────────────────
  private getTextarea(): HTMLTextAreaElement {
    return this.editorRef.nativeElement;
  }

  /** Wrap selected text (or placeholder) with prefix/suffix */
  private wrap(prefix: string, suffix: string, placeholder: string): void {
    const ta = this.getTextarea();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end) || placeholder;
    const newText = ta.value.substring(0, start) + prefix + selected + suffix + ta.value.substring(end);

    this.setValue(ta, newText);
    // Reposition cursor inside the wrapped text
    ta.selectionStart = start + prefix.length;
    ta.selectionEnd = start + prefix.length + selected.length;
    ta.focus();
  }

  /** Add a prefix to the current line */
  private prefixLine(prefix: string): void {
    const ta = this.getTextarea();
    const pos = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
    const lineText = ta.value.substring(lineStart);

    // Toggle: remove prefix if already present, else add
    let newText: string;
    if (lineText.startsWith(prefix)) {
      newText = ta.value.substring(0, lineStart) + lineText.substring(prefix.length);
    } else {
      newText = ta.value.substring(0, lineStart) + prefix + lineText;
    }

    this.setValue(ta, newText);
    ta.selectionStart = ta.selectionEnd = pos + prefix.length;
    ta.focus();
  }

  /** Insert raw text at cursor */
  private insertText(text: string): void {
    const ta = this.getTextarea();
    const start = ta.selectionStart;
    const newText = ta.value.substring(0, start) + text + ta.value.substring(ta.selectionEnd);
    this.setValue(ta, newText);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.focus();
  }

  private setValue(ta: HTMLTextAreaElement, newText: string): void {
    ta.value = newText;
    this.value.set(newText);
    this.onChange(newText);
    this.autoResize(ta);
    this.emitWordCount(newText);
  }

  // ── Keyboard shortcuts ───────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    switch (e.key.toLowerCase()) {
      case 'b': e.preventDefault(); this.wrap('**', '**', 'bold text'); break;
      case 'i': e.preventDefault(); this.wrap('_', '_', 'italic text'); break;
      case '`': e.preventDefault(); this.wrap('`', '`', 'code'); break;
    }
  }
}
