import { Injectable, inject } from '@angular/core';
import { Database, ref, push, onValue, off, serverTimestamp, set, onDisconnect } from '@angular/fire/database';
import { Auth, User } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { ChatMessage, ChatUser } from '../../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private db = inject(Database);
  private auth = inject(Auth);
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private onlineUsersSubject = new BehaviorSubject<ChatUser[]>([]);
  
  public messages$ = this.messagesSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();
  
  private messagesRef: any;
  private usersRef: any;
  private onlineUsersRef: any;

  constructor() {
    this.initializeRefs();
    this.listenToMessages();
    this.listenToOnlineUsers();
    this.setupUserPresence();
  }

  private initializeRefs(): void {
    this.messagesRef = ref(this.db, 'messages');
    this.usersRef = ref(this.db, 'users');
    this.onlineUsersRef = ref(this.db, 'onlineUsers');
  }

  // Send a message to the chat
  async sendMessage(text: string): Promise<void> {
    const user = this.auth.currentUser;
    
    if (!user || !text.trim()) {
      return;
    }

    const message: Omit<ChatMessage, 'id'> = {
      text: text.trim(),
      senderId: user.uid,
      senderName: this.getUserDisplayName(user),
      timestamp: Date.now(),
      type: 'text'
    };

    try {
      await push(this.messagesRef, message);
    } catch (error) {
      throw error;
    }
  }

  // Listen to real-time messages
  private listenToMessages(): void {
    onValue(this.messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages: ChatMessage[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        this.messagesSubject.next(messages);
      } else {
        this.messagesSubject.next([]);
      }
    });
  }

  // Listen to online users
  private listenToOnlineUsers(): void {
    onValue(this.onlineUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users: ChatUser[] = Object.keys(data).map(key => ({
          uid: key,
          ...data[key]
        }));
        this.onlineUsersSubject.next(users);
      } else {
        this.onlineUsersSubject.next([]);
      }
    });
  }

  // Setup user presence (online/offline status)
  private setupUserPresence(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.setUserOnline(user);
      }
    });
  }

  // Set user as online and handle presence
  private setUserOnline(user: any): void {
    const userPresenceRef = ref(this.db, `onlineUsers/${user.uid}`);
    const userInfo: ChatUser = {
      uid: user.uid,
      displayName: this.getUserDisplayName(user),
      isOnline: true,
      lastSeen: Date.now()
    };

    // Set user as online
    set(userPresenceRef, userInfo);

    // Remove user when they disconnect
    onDisconnect(userPresenceRef).remove();

    // Update last seen timestamp periodically
    setInterval(() => {
      if (this.auth.currentUser) {
        set(ref(this.db, `onlineUsers/${user.uid}/lastSeen`), Date.now());
      }
    }, 60000); // Update every minute
  }

  // Refresh for current user (called when authentication state changes)
  refreshForCurrentUser(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.setUserOnline(user);
    }
  }

  // Get user display name from email (removing @example.com part)
  private getUserDisplayName(user: User): string {
    if (user.email) {
      return user.email.split('@')[0];
    }
    return user.uid.substring(0, 8);
  }

  // Get current user info
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Clear chat (admin function)
  async clearChat(): Promise<void> {
    try {
      await set(this.messagesRef, null);
    } catch (error) {
      throw error;
    }
  }

  // Cleanup listeners when service is destroyed
  ngOnDestroy(): void {
    off(this.messagesRef);
    off(this.onlineUsersRef);
  }
}