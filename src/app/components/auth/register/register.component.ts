import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.components.scss'],
	standalone: true,
	imports: [ReactiveFormsModule]
})
export class RegisterComponent {
	private authService = inject(AuthService);
	private router = inject(Router);
	private fb = inject(FormBuilder);

	registerForm: FormGroup;
	errorMessage: string = '';
	isLoading: boolean = false;

	constructor() {
		this.registerForm = this.fb.group({
			firstName: ['', [Validators.required]],
			lastName: ['', [Validators.required]],
			username: ['', [Validators.required]],
			password: ['', [Validators.required, Validators.minLength(6)]]
		});
	}

	async register() {
		if (!this.registerForm.valid) return;

		const { firstName, lastName, username, password } = this.registerForm.value;
		this.isLoading = true;
		this.errorMessage = '';

		try {
			await this.authService.register(firstName, lastName, username, password);
			// Navigation is handled by the auth service
		} catch (err: any) {
			this.errorMessage = err.message;
		} finally {
			this.isLoading = false;
		}
	}
}
