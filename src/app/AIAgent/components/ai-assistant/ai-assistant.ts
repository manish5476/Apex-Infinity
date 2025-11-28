
import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ChatService } from '../../services/chat';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-assistant',
  imports: [CommonModule,FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false; // Is the chat window open?
  isLoading = false; // Is the AI thinking?
  userMessage = '';

  messages: any[] = [
    {
      text: "Hi! I'm your CRM Assistant. Ask me about sales, inventory, or pending payments.",
      sender: 'bot',
      timestamp: new Date()
    }
  ];

  constructor(private chatService: ChatService) { }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.scrollToBottom();
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    // 1. Add User Message immediately
    this.messages.push({
      text: this.userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    const currentMsg = this.userMessage;
    this.userMessage = ''; // Clear input
    this.isLoading = true;
    this.scrollToBottom();

    // 2. Send to Backend
    this.chatService.sendMessage(currentMsg).subscribe({
      next: (response) => {
        this.messages.push({
          text: response.reply, // Matches res.json({ reply: ... }) in Node
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        this.messages.push({
          text: "I'm having trouble connecting to the server.",
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  // Auto-scroll to the newest message
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }
}