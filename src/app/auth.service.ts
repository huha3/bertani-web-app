import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { AuthResponse, createClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

    register(email: string, password: string, name: string ,username: string, nomor: string, dateBirth: Date, address: string) {
        const promise = this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username, name, dateBirth : dateBirth.toISOString(), nomor, address
                }
            }
        });
        return from(promise);
    }
}