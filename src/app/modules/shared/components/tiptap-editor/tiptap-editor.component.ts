import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  forwardRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
// import { generateHTML, generateText } from '@tiptap/html';

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tiptap-editor.component.html',
  styleUrls: ['./tiptap-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TiptapEditorComponent),
      multi: true
    }
  ]
})
export class TiptapEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorEl', { static: true }) editorEl!: ElementRef<HTMLDivElement>;
  @Input() placeholder = 'Start writing your note...';
  @Input() minHeight = '320px';
  @Output() wordCount = new EventEmitter<number>();

  private cdr = inject(ChangeDetectorRef);

  editor!: Editor;
  isDisabled = signal(false);
  activeFormats = signal<Set<string>>(new Set());
  words = signal(0);
  isLinkDialogOpen = signal(false);
  linkUrl = signal('');

  private onChange: (val: any) => void = () => { };
  private onTouched: () => void = () => { };

  // ControlValueAccessor
  writeValue(value: any): void {
    if (!this.editor) return;
    if (!value) {
      this.editor.commands.clearContent(false); // clearContent signature is still boolean
      return;
    }
    // Accept both JSON and HTML string
    if (typeof value === 'string') {
      if (value.startsWith('<') || value === '') {
        this.editor.commands.setContent(value, { emitUpdate: false });
      } else {
        try {
          this.editor.commands.setContent(JSON.parse(value), { emitUpdate: false });
        } catch {
          this.editor.commands.setContent(value, { emitUpdate: false });
        }
      }
    } else if (typeof value === 'object') {
      this.editor.commands.setContent(value, { emitUpdate: false });
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    isDisabled ? this.editor?.setEditable(false) : this.editor?.setEditable(true);
  }

  ngOnInit(): void {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: {
            HTMLAttributes: { class: 'code-block' }
          }
        }),
        Placeholder.configure({ placeholder: this.placeholder }),
        Link.configure({ openOnClick: false, autolink: true }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true })
      ],
      editorProps: {
        attributes: {
          class: 'tiptap-content',
          spellcheck: 'true'
        }
      },
      onUpdate: ({ editor }) => {
        // Emit as JSON (clean, no HTML soup)
        const json = editor.getJSON();
        this.onChange(json);
        this.onTouched();
        this.updateWordCount(editor.getText());
        this.updateActiveFormats();
        this.cdr.markForCheck();
      },
      onSelectionUpdate: () => {
        this.updateActiveFormats();
        this.cdr.markForCheck();
      },
      onFocus: () => {
        this.onTouched();
      }
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  private updateWordCount(text: string) {
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.words.set(count);
    this.wordCount.emit(count);
  }

  private updateActiveFormats() {
    const formats = new Set<string>();
    if (this.editor.isActive('bold')) formats.add('bold');
    if (this.editor.isActive('italic')) formats.add('italic');
    if (this.editor.isActive('underline')) formats.add('underline');
    if (this.editor.isActive('strike')) formats.add('strike');
    if (this.editor.isActive('code')) formats.add('code');
    if (this.editor.isActive('codeBlock')) formats.add('codeBlock');
    if (this.editor.isActive('bulletList')) formats.add('bulletList');
    if (this.editor.isActive('orderedList')) formats.add('orderedList');
    if (this.editor.isActive('taskList')) formats.add('taskList');
    if (this.editor.isActive('blockquote')) formats.add('blockquote');
    if (this.editor.isActive('heading', { level: 1 })) formats.add('h1');
    if (this.editor.isActive('heading', { level: 2 })) formats.add('h2');
    if (this.editor.isActive('heading', { level: 3 })) formats.add('h3');
    if (this.editor.isActive('link')) formats.add('link');
    this.activeFormats.set(formats);
  }

  isActive(format: string, attrs?: any): boolean {
    return attrs
      ? this.editor?.isActive(format, attrs)
      : this.activeFormats().has(format);
  }

  // --- Toolbar actions ---
  toggleBold() { this.editor.chain().focus().toggleBold().run(); }
  toggleItalic() { this.editor.chain().focus().toggleItalic().run(); }
  toggleUnderline() { this.editor.chain().focus().toggleUnderline().run(); }
  toggleStrike() { this.editor.chain().focus().toggleStrike().run(); }
  toggleCode() { this.editor.chain().focus().toggleCode().run(); }
  toggleCodeBlock() { this.editor.chain().focus().toggleCodeBlock().run(); }
  toggleBulletList() { this.editor.chain().focus().toggleBulletList().run(); }
  toggleOrderedList() { this.editor.chain().focus().toggleOrderedList().run(); }
  toggleTaskList() { this.editor.chain().focus().toggleTaskList().run(); }
  toggleBlockquote() { this.editor.chain().focus().toggleBlockquote().run(); }
  setHeading(level: 1 | 2 | 3) { this.editor.chain().focus().toggleHeading({ level }).run(); }
  insertHRule() { this.editor.chain().focus().setHorizontalRule().run(); }

  openLinkDialog() {
    const prev = this.editor.getAttributes('link')['href'] || '';
    this.linkUrl.set(prev);
    this.isLinkDialogOpen.set(true);
    this.cdr.markForCheck();
  }

  applyLink() {
    const url = this.linkUrl().trim();
    if (url) {
      this.editor.chain().focus().setLink({ href: url }).run();
    } else {
      this.editor.chain().focus().unsetLink().run();
    }
    this.isLinkDialogOpen.set(false);
    this.cdr.markForCheck();
  }

  cancelLink() {
    this.isLinkDialogOpen.set(false);
    this.cdr.markForCheck();
  }

  removeLink() {
    this.editor.chain().focus().unsetLink().run();
    this.isLinkDialogOpen.set(false);
  }

  undo() { this.editor.chain().focus().undo().run(); }
  redo() { this.editor.chain().focus().redo().run(); }

  canUndo() { return this.editor?.can().undo(); }
  canRedo() { return this.editor?.can().redo(); }

  // Helper: get plain HTML for read-mode rendering
  getHTML(): string {
    return this.editor?.getHTML() || '';
  }
}