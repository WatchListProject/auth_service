import { Injectable } from '@nestjs/common';
import { LoginRequest, RegisterRequest, ValidateRequest } from './auth_service.pb';
import * as jwt from 'jsonwebtoken';

interface user {
  email: string;
  password: string;
};

@Injectable()
export class AppService {

  private users: user[] = [{ email: 'abc', password: '123' }];
  private readonly jwtSecret = 'your-secret-key2';

  register(request: RegisterRequest) {
    throw new Error('Method not implemented.');
  }

  login(request: LoginRequest) {
    const user = this.users.find(u => u.email === request.email && u.password === request.password);
    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    const token = jwt.sign({ email: user.email, aud: "Watchlist" }, this.jwtSecret, { expiresIn: '1h' });
    return { success: true, token };
  }
  validate(request: ValidateRequest): import('./auth_service.pb').ValidateResponse | Promise<import('./auth_service.pb').ValidateResponse> | import('rxjs').Observable<import('./auth_service.pb').ValidateResponse> {
    if (request.token === undefined || request.token === '') {
      return { valid: false, message: 'Token is required' };
    }
    try {
      jwt.verify(request.token, this.jwtSecret);
      return { valid: true };
    } catch (error) {
      return { valid: false, message: 'Invalid token' };
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
