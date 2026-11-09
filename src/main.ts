import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.modules'; // Corrigido de app.modules para app.module
import session from 'express-session';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(cookieParser)

  app.use(
    csurf({
      cookie: {
        key: '_csrf',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        samSite: 'lax',
      },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 3. Configuração do middleware de sessão
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 horas
        httpOnly: true,
        secure: false, // Defina como true apenas em produção com HTTPS
      },
    }),
  );

  // Escuta na interface 0.0.0.0 para aceitar tráfego do container Docker
  await app.listen(3000, '0.0.0.0');
}

bootstrap();