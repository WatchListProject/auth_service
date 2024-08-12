import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({
    required: true,
    unique: true
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: [] })
  mediaList: [Media];

}

export class Media {
  @Prop({ required: true })
  mediaId: string; // The ID of the media in the corresponding media API

  @Prop({ 
    required: true,
    enum: ['MOVIE', 'SERIE']
  })
  mediaType: string;// The type of the media in the corresponding media API ej: mediaType=Movie

  @Prop({ required: true })
  seen: boolean;

}

export const UserSchema = SchemaFactory.createForClass(User);