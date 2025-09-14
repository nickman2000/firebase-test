import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../chat/chat.component';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../chat/chat.service';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [FormsModule, CommonModule, RouterModule, ChatComponent],
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent {
	protected authService = inject(AuthService);
	protected chatService = inject(ChatService);

	async logout() {
		try {
			this.chatService.setUserOffline();
			await this.authService.logout();
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
}
