import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { ChatMessage, ChatUser } from '../../models/chat.models';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [FormsModule, CommonModule],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  
  messages$: Observable<ChatMessage[]>;
  onlineUsers$: Observable<ChatUser[]>;
  
  newMessage: string = '';
  currentUser: any = null;
  isLoading: boolean = false;
  error: string = '';

  constructor() {
    this.messages$ = this.chatService.messages$;
    this.onlineUsers$ = this.chatService.onlineUsers$;
    
    // Use effect to react to auth state changes
    effect(() => {
      const user = this.authService.currentUser();
      this.currentUser = user;
      if (!user) {
        this.error = 'You must be logged in to use the chat';
      } else {
        this.error = '';
        // Reinitialize chat when user changes
        this.chatService.refreshForCurrentUser();
      }
    });
  }

  ngOnInit(): void {
    // Initialization is now handled in constructor with effect
  }

  ngOnDestroy(): void {
    // Cleanup is handled by the service
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || this.isLoading) {
      return;
    }

    // Check if we have a current user
    if (!this.currentUser) {
      this.error = 'You must be logged in to send messages';
      return;
    }
    
    // Store the message to send and clear input immediately
    const messageToSend = this.newMessage.trim();
    this.newMessage = '';
    this.isLoading = true;
    this.error = '';
    
    try {
      await this.chatService.sendMessage(messageToSend);
    } catch (error) {
      this.error = 'Failed to send message. Please try again.';
      // Restore the message if sending failed
      this.newMessage = messageToSend;
    } finally {
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        // Silently handle scroll errors
      }
    }
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isOwnMessage(message: ChatMessage): boolean {
    return this.currentUser && message.senderId === this.currentUser.uid;
  }

  async clearChat(): Promise<void> {
    if (confirm('Are you sure you want to clear all messages?')) {
      try {
        await this.chatService.clearChat();
      } catch (error) {
        this.error = 'Failed to clear chat. Please try again.';
      }
    }
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id || index.toString();
  }
}