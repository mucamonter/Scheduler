import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import session from 'express-session';


//Initializing
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);


  //In this way, dosen't need to rewrite every time the 'api'
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());


  const allowedOrigins = process.env.CORS_ORIGIN;

  //Cors = Cross-Origin Resource Sharing
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    credentials: true,
  });

  //
  app.use(
    session({
      secret: 'process.env.SESSION_SECRET',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    }),
  );

  await app.listen(3000, '0.0.0.0');

}


void bootstrap();
