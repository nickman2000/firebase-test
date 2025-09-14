import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [FormsModule, CommonModule, ChatComponent],
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent {
	protected authService = inject(AuthService);

	async logout() {
		try {
			await this.authService.logout();
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
}
