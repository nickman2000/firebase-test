import { Injectable, inject, signal } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Firestore, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);

  // Signal to track current user and auth state
  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public isLoading = signal<boolean>(true);

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(!!user);
      this.isLoading.set(false);
      
      // Redirect based on auth state
      if (user) {
        // User is signed in, redirect to main page if on login/register
        const currentUrl = this.router.url;
        if (currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/') {
          this.router.navigate(['/main-page']);
        }
      } else {
        // User is signed out, redirect to login if on protected pages
        const currentUrl = this.router.url;
        if (currentUrl === '/main-page') {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  async login(nickname: string, password: string): Promise<void> {
    try {
      const email = `${nickname}@example.com`;
      await signInWithEmailAndPassword(this.auth, email, password);
      // Navigation will be handled by onAuthStateChanged
    } catch (error) {
      throw error;
    }
  }

  async register(firstName: string, lastName: string, username: string, password: string): Promise<void> {
    try {
      const email = `${username}@example.com`;
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Add user to Firestore
      const usersCollection = collection(this.firestore, 'users');
      await addDoc(usersCollection, {
        uid: userCredential.user.uid,
        firstName,
        lastName,
        username,
        email
      });
      // Navigation will be handled by onAuthStateChanged
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      // Navigation will be handled by onAuthStateChanged
    } catch (error) {
      throw error;
    }
  }

  async getUserData(): Promise<any> {
    if (!this.currentUser()) return null;
    
    try {
      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('uid', '==', this.currentUser()!.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }
}