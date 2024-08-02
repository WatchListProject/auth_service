import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [ClientsModule.register([
    {
      name: 'AUTH_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(__dirname, '../node_modules/protos/auth_service.proto'),
      },
    },
  ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
