import { Injectable } from '@nestjs/common';
import { LoginRequest, RegisterRequest, ValidateRequest } from './auth_service.pb';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from './mongoose/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

interface user {
  email: string;
  password: string;
};

@Injectable()
export class AppService {

  private users: user[] = [{ email: 'abc', password: '123' }];
  private readonly jwtSecret = 'your-secret-key2';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) { }


  async register(request: RegisterRequest) {
    if (request.password == request.repeatedPassword) {
      const createUser = new this.userModel({ email: request.email, password: request.password });
      await createUser.save();
      return { success: true };

    }
    return { success: false };
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
