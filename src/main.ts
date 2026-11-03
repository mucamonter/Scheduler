import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.modules'; // Corrigido de app.modules para app.module
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configura o prefixo global (/api) para todas as rotas
  app.setGlobalPrefix('api');

  // 2. Habilita CORS com envio de credenciais (cookies de sessão)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 3. Configuração do middleware de sessão
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'sua-chave-secreta-aqui',
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