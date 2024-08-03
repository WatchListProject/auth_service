import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'dotenv';
import { User, UserSchema } from './mongoose/user.schema';
config();

const mongoURI = process.env.MONGODB_URI;
@Module({
  imports: [
    MongooseModule.forRoot(mongoURI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ClientsModule.register([
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
