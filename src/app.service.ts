import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ValidateRequest, ValidateResponse } from './auth_service.pb';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from './mongoose/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AppService {
  private readonly jwtSecret = process.env.JWT_SECRET_KEY;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) { }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    if (request.password !== request.repeatedPassword) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Passwords do not match' });
    }

    if (!this.validateEmail(request.email)) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Invalid email format' });
    }

    const existingUser = await this.userModel.findOne({ email: request.email });
    if (existingUser) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: 'User already registered' });
    }

    const createUser = new this.userModel({ email: request.email, password: request.password });
    try {
      await createUser.save();
      return { success: true };
    } catch (error) {
      throw new RpcException({ code: status.INTERNAL, message: 'Error creating user: ' + error.message });
    }
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const user = await this.userModel.findOne({ email: request.email });

    if(!this.validateEmail(user.email)){
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Invalid email format' });
    }

    if (!user) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });
    }

    if (user.password !== request.password) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Password does not match' });
    }

    const userToken = jwt.sign({ email: user.email, aud: 'Watchlist' }, this.jwtSecret, { expiresIn: '1h' });
    return { success: true, token: userToken };
  }

  validate(request: ValidateRequest): ValidateResponse {
    if (!request.token) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Token not found' });
    }

    try {
      jwt.verify(request.token, this.jwtSecret);
      return { valid: true };
    } catch (error) {
      throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Error during token validation: ' + error.message });
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
