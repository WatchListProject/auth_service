import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthServiceController, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ValidateRequest, ValidateResponse } from './auth_service.pb';
import { Observable } from 'rxjs';
import { GrpcMethod } from '@nestjs/microservices';
import * as jwt from 'jsonwebtoken';

@Controller()
export class AppController implements AuthServiceController {
  constructor(private readonly appService: AppService) { }

  @GrpcMethod('AuthService', 'Register')
  register(request: RegisterRequest): Promise<RegisterResponse> | Observable<RegisterResponse> | RegisterResponse {
    return this.appService.register(request);
  }

  @GrpcMethod('AuthService', 'Login')
  login(request: LoginRequest): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse {
    return this.appService.login(request);
  }

  @GrpcMethod('AuthService', 'Validate')
  async validate(request: ValidateRequest): Promise<ValidateResponse> {
    // Decodificar el token
    let decodedToken: any;
    try {
      decodedToken = jwt.decode(request.token);
    } catch (error) {
      throw new Error('Invalid token');
    }

    // Verificar que el token contiene el campo `iss` (Issuer)
    if (!decodedToken || !decodedToken.iss) {
      throw new Error('No iss (Issuer) found in token');
    }

    // Lógica según el iss
    if (decodedToken.iss === 'https://securetoken.google.com/watchlist-9c568') {
      // Si el proveedor es Google, validamos con Firebase
      return this.appService.validateWithFirebase(request);
    } else if (decodedToken.iss === 'watchlist_auth_service') {
      // Si el proveedor es Watchlist Auth Service, validamos con el propio servicio
      return this.appService.validate(request);
    } else {
      // Si no es ninguno de los proveedores esperados, lanzamos un error
      throw new Error('Unsupported token iss (Issuer)');
    }
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
