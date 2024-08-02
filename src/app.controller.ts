import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthServiceController, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ValidateRequest, ValidateResponse } from './auth_service.pb';
import { Observable } from 'rxjs';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AppController implements AuthServiceController {
  constructor(private readonly appService: AppService) { }

  @GrpcMethod('AuthService', 'Register')
  register(request: RegisterRequest): Promise<RegisterResponse> | Observable<RegisterResponse> | RegisterResponse {
    this.appService.register(request);
    throw new Error('Method not implemented.');
  }

  @GrpcMethod('AuthService', 'Login')
  login(request: LoginRequest): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse {
    return this.appService.login(request);
  }

  @GrpcMethod('AuthService', 'Validate')
  validate(request: ValidateRequest): Promise<ValidateResponse> | Observable<ValidateResponse> | ValidateResponse {
    return this.appService.validate(request);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
