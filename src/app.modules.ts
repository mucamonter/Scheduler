import { Module } from '@nestjs/common';
import { join } from 'node:path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Controllers Públicos e Autenticação
import { AuthController } from './auth/auth.controller';
import { CidadaoController } from './cidadao/cidadao.controller';
import { AgendamentoController } from './agendamento/agendamento.controller';

// Controllers Administrativos (Painel)
import { AdminAgendamentosController } from './admin/admin.agedamentos.controller';
import { AdminPainelController } from './admin/admin-painel.controller';
import { AdminUsuariosController } from './admin/usuario.controller';
import { AdminCidadaosController } from './admin/admin.cidadao.controller';

// Services e Guards
import { PrismaService } from './prisma.service';
import { CidadaoGuard } from './cidadao/cidadao.guard';
import { AdminGuard } from './common/guards/admin.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
      rootPath: join(process.cwd(), 'app'),
      exclude: ['/api/*path'],
    })
  ],
  controllers: [
    AuthController,
    CidadaoController,
    AgendamentoController,
    AdminAgendamentosController, // Adicionado
    AdminUsuariosController,
    AdminCidadaosController,
    AdminPainelController,
  ],
  providers: [PrismaService, CidadaoGuard, AdminGuard],
})
export class AppModule {}