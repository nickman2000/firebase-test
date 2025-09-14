import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  public userData = signal<any>(null);
  public isLoading = signal<boolean>(true);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUserData();
  }

  async loadUserData(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const data = await this.authService.getUserData();
      if (data) {
        this.userData.set(data);
      } else {
        this.error.set('მომხმარებლის ინფორმაცია ვერ მოიძებნა');
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      this.error.set('შეცდომა მონაცემების ჩატვირთვისას');
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Error during logout:', error);
      this.error.set('შეცდომა სისტემიდან გასვლისას');
    }
  }

  goToMainPage(): void {
    this.router.navigate(['/main-page']);
  }

  refreshProfile(): void {
    this.loadUserData();
  }
}
