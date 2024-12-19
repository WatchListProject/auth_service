import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ValidateRequest, ValidateResponse } from './auth_service.pb';
import * as jwt from 'jsonwebtoken';
import { AuthProvider, User, UserDocument } from './mongoose/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class AppService {

  private readonly jwtSecretv: string;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    this.jwtSecretv = process.env.JWT_SECRET_KEY;

    const serviceAccount = path.join('./', 'firebase_auth_credentials.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

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

    try {
      const createUser = new this.userModel({ email: request.email, authProvider: AuthProvider.WATCHLIST, password: request.password });
      await createUser.save();
      return { success: true };
    } catch (error) {
      throw new RpcException({ code: status.INTERNAL, message: error.message });
    }
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      if (!this.validateEmail(request.email)) {
        throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Invalid email format' });
      }

      const user = await this.userModel.findOne({ email: request.email });

      if (!user) {
        throw new RpcException({ code: status.NOT_FOUND, message: 'User not found' });
      }

      if (user.password !== request.password) {
        throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Password does not match' });
      }

      const userToken = jwt.sign({ email: user.email, userId: user._id.toString(), iss: 'watchlist_auth_service' }, this.jwtSecretv, { expiresIn: '1h' });
      return { success: true, token: userToken };

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      } else {
        throw new RpcException({ code: status.INTERNAL, message: 'Internal server error' });
      }
    }
  }


  async validate(request: ValidateRequest): Promise<ValidateResponse> {
    if (!request.token) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Token not found' });
    }

    try {
      jwt.verify(request.token, this.jwtSecretv);
      const decodedToken: any = jwt.decode(request.token);
      let user = await this.userModel.findOne({ email: decodedToken.email });
      return { valid: true };
    } catch (error) {
      throw new RpcException({ code: status.UNAUTHENTICATED, message: error });
    }
  }

  async validateWithFirebase(request: ValidateRequest): Promise<ValidateResponse> {
    console.log("validateWithFirebase");
    if (!request.token) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Token not found' });
    }

    try {
      const decodedToken: any = jwt.decode(request.token);
      if (!decodedToken || !decodedToken.iss || decodedToken.iss !== 'https://securetoken.google.com/watchlist-9c568') {
        throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Unsupported sign-in provider' });
      }

      const firebaseToken = await admin.auth().verifyIdToken(request.token);

      let user = await this.userModel.findOne({ email: firebaseToken.email });

      if (!user) {
        console.log("new user");
        user = new this.userModel({
          email: firebaseToken.email,
          uid: firebaseToken.uid,
          authProvider: AuthProvider.GOOGLE
        });
        await user.save();
      }


      if (user.uid !== firebaseToken.uid) {
        throw new RpcException({ code: status.UNAUTHENTICATED, message: 'UID mismatch' });
      }
      return { valid: true };
    } catch (error) {
      throw new RpcException({ code: status.UNAUTHENTICATED, message: error.message });
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
