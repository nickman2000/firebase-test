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
  
  private presenceInterval: any = null;
  private currentUserId: string | null = null;
  private messageListener: any = null;
  private onlineUsersListener: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeRefs();
    this.setupUserPresence();
  }

  private initializeRefs(): void {
    this.messagesRef = ref(this.db, 'messages');
    this.usersRef = ref(this.db, 'users');
    this.onlineUsersRef = ref(this.db, 'onlineUsers');
  }

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

  private listenToMessages(): void {
    if (this.messageListener) {
      off(this.messagesRef, 'value', this.messageListener);
    }
    
    this.messageListener = onValue(this.messagesRef, (snapshot) => {
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

  private listenToOnlineUsers(): void {
    if (this.onlineUsersListener) {
      off(this.onlineUsersRef, 'value', this.onlineUsersListener);
    }
    
    this.onlineUsersListener = onValue(this.onlineUsersRef, (snapshot) => {
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

  private setupUserPresence(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        if (this.currentUserId !== user.uid) {
          this.setUserOnline(user);
        }
        if (!this.isInitialized) {
          this.initializeChatListeners();
          this.isInitialized = true;
        }
      } else {
        this.cleanupUserPresence();
        this.cleanupListeners();
        this.isInitialized = false;
        if (this.currentUserId) {
          const userPresenceRef = ref(this.db, `onlineUsers/${this.currentUserId}`);
          set(userPresenceRef, null);
        }
      }
    });
  }

  private initializeChatListeners(): void {
    this.listenToMessages();
    this.listenToOnlineUsers();
  }

  private cleanupListeners(): void {
    if (this.messageListener) {
      off(this.messagesRef, 'value', this.messageListener);
      this.messageListener = null;
    }
    if (this.onlineUsersListener) {
      off(this.onlineUsersRef, 'value', this.onlineUsersListener);
      this.onlineUsersListener = null;
    }
    this.messagesSubject.next([]);
    this.onlineUsersSubject.next([]);
  }

  private setUserOnline(user: any): void {
    this.cleanupUserPresence();
    
    this.currentUserId = user.uid;
    const userPresenceRef = ref(this.db, `onlineUsers/${user.uid}`);
    const userInfo: ChatUser = {
      uid: user.uid,
      displayName: this.getUserDisplayName(user),
      isOnline: true,
      lastSeen: Date.now()
    };

    set(userPresenceRef, userInfo);

    onDisconnect(userPresenceRef).remove();

    this.presenceInterval = setInterval(() => {
      if (this.auth.currentUser && this.auth.currentUser.uid === user.uid) {
        set(ref(this.db, `onlineUsers/${user.uid}/lastSeen`), Date.now());
      }
    }, 60000);
  }

  private cleanupUserPresence(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    this.currentUserId = null;
  }

  setUserOffline(): void {
    if (this.currentUserId) {
      const userPresenceRef = ref(this.db, `onlineUsers/${this.currentUserId}`);
      set(userPresenceRef, null);
      this.cleanupUserPresence();
    }
  }

  refreshForCurrentUser(): void {
    const user = this.auth.currentUser;
    if (user && this.currentUserId !== user.uid) {
      this.setUserOnline(user);
    }
    if (user && !this.isInitialized) {
      this.initializeChatListeners();
      this.isInitialized = true;
    }
  }

  private getUserDisplayName(user: User): string {
    if (user.email) {
      return user.email.split('@')[0];
    }
    return user.uid.substring(0, 8);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  async clearChat(): Promise<void> {
    try {
      await set(this.messagesRef, null);
    } catch (error) {
      throw error;
    }
  }

  ngOnDestroy(): void {
    this.cleanupListeners();
    this.cleanupUserPresence();
  }
}