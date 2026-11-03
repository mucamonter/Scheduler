import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Req, 
  HttpCode, 
  HttpStatus, 
  UnauthorizedException, 
  InternalServerErrorException 
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Request } from "express";
import * as bcrypt from 'bcryptjs';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    papel?: string;
    email?: string;
    usuario?: { id?: number; nome?: string; email?: string };
    cidadaoId?: number;
    cidadaoEmail?: string;
    cidadaoNome?: string;
  }
}

@Controller()
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, database: process.env.DB_NAME || 'V2_DB' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { login?: string; email?: string; senha?: string }, @Req() req: Request) {
    const identificador = (body.login || body.email || '').trim().toLowerCase();
    const senha = body.senha || '';

    if (!req.session) {
      throw new InternalServerErrorException('O suporte a sessões (express-session) não está configurado.');
    }

    if (!identificador || !senha) {
      throw new UnauthorizedException({ mensagem: 'Informe o e-mail/login e a senha.' });
    }

    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 1. Super Admin do arquivo .env
    if (adminUser && adminPassword && identificador === adminUser.toLowerCase() && senha === adminPassword) {
      const adminDoBanco = await this.prisma.usuarios_admin.findFirst({
        where: { email: identificador }
      });

      req.session.papel = 'admin';
      req.session.usuario = { 
        id: adminDoBanco?.id, 
        nome: adminUser, 
        email: adminDoBanco?.email || identificador 
      };

      return { sucesso: true, tipo: 'admin', redirect: '/admin.html' };
    }

    // 2. Admin/Staff cadastrado na tabela usuarios_admin
    const staffUser = await this.prisma.usuarios_admin.findFirst({
      where: { email: identificador },
    });

    if (staffUser && (await bcrypt.compare(senha, staffUser.senha_hash))) {
      req.session.papel = staffUser.papel;
      req.session.email = staffUser.email;
      req.session.usuario = {
        id: staffUser.id,
        nome: staffUser.nome,
        email: staffUser.email
      };

      return { sucesso: true, tipo: staffUser.papel, redirect: '/admin.html' };
    }

    // 3. Cidadão cadastrado na tabela cidadaos
    const cidadao = await this.prisma.cidadaos.findFirst({
      where: { email: identificador },
    });

    if (cidadao && (await bcrypt.compare(senha, cidadao.senha_hash))) {
      req.session.papel = 'cidadao';
      req.session.cidadaoId = cidadao.id;
      req.session.cidadaoEmail = cidadao.email;
      req.session.cidadaoNome = cidadao.nome;

      // Preenche req.session.usuario para manter compatibilidade com os Guards de rota
      req.session.usuario = {
        id: cidadao.id,
        nome: cidadao.nome,
        email: cidadao.email
      };

      return { sucesso: true, tipo: 'cidadao', redirect: '/cidadao.html' };
    }

    throw new UnauthorizedException({ mensagem: 'Usuário ou senha inválidos.' });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(new InternalServerErrorException('Erro ao encerrar a sessão'));
        } else {
          resolve({ sucesso: true });
        }
      });
    });
  }

  @Get('admin/me')
  async adminMe(@Req() req: Request) {
    if (!req.session?.papel) {
      throw new UnauthorizedException({ autenticado: false });
    }

    return {
      autenticado: true,
      usuario: req.session.usuario || req.session.cidadaoEmail || req.session.email,
      papel: req.session.papel,
    };
  }
}