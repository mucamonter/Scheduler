import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  ParseIntPipe, 
  Req, 
  UseGuards, 
  ConflictException, 
  BadRequestException, 
  NotFoundException, 
  UnauthorizedException 
} from "@nestjs/common";
import { Request } from "express";
import * as bcrypt from 'bcryptjs';
import 'express-session';

import { CidadaoGuard } from "./cidadao.guard";
import { PrismaService } from "../prisma.service";

declare module 'express-session' {
  interface SessionData {
    papel?: string;
    cidadaoId?: number;
    cidadaoEmail?: string;
    cidadaoNome?: string;
    usuario?: { id?: number; nome?: string; email?: string };
  }
}

@Controller('cidadao')
export class CidadaoController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('cadastro')
  async cadastrar(
    @Body() body: { 
      nome?: string; 
      email?: string; 
      senha?: string; 
      telefone?: string; 
      cep?: string; 
      endereco?: string 
    }
  ) {
    const nome = (body.nome || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const senha = body.senha || '';

    if (!nome || !email || !senha) {
      throw new BadRequestException('Nome, e-mail e senha são obrigatórios.');
    }

    if (senha.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    const existente = await this.prisma.cidadaos.findFirst({ where: { email } });
    if (existente) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const senha_hash = await bcrypt.hash(senha, 12);

    const novoCidadao = await this.prisma.cidadaos.create({
      data: {
        nome,
        email,
        senha_hash,
        telefone: body.telefone || null,
        cep: body.cep || null,
        endereco: body.endereco || null,
      },
    });

    return { sucesso: true, id: novoCidadao.id };
  }

  @UseGuards(CidadaoGuard)
  @Get('me')
  async obterPerfil(@Req() req: Request) {
    const cidadaoId = req.session?.cidadaoId || req.session?.usuario?.id;

    if (!cidadaoId) {
      throw new UnauthorizedException('Sessão expirada.');
    }

    const cidadao = await this.prisma.cidadaos.findUnique({
      where: { id: cidadaoId },
      select: { id: true, nome: true, email: true, telefone: true }
    });

    if (!cidadao) {
      throw new UnauthorizedException('Cidadão não encontrado.');
    }

    return {
      autenticado: true,
      cidadao
    };
  }

  @UseGuards(CidadaoGuard)
  @Get('meus-agendamentos')
  async meusAgendamentos(@Req() req: Request) {
    const cidadaoId = req.session?.cidadaoId || req.session?.usuario?.id;

    if (!cidadaoId) {
      throw new UnauthorizedException('Sessão expirada.');
    }

    const cidadao = await this.prisma.cidadaos.findUnique({
      where: { id: cidadaoId },
      select: { id: true, nome: true, telefone: true, email: true },
    });

    if (!cidadao) {
      throw new UnauthorizedException('Cidadão não encontrado.');
    }

    const agendamentosRaw = await this.prisma.agendamentos.findMany({
      where: { cidadao_id: cidadaoId },
      orderBy: { data: 'desc' },
    });

    const agendamentos = agendamentosRaw.map((a: any) => {
      // 1. Data formatada em DD/MM/YYYY via Regex
      let dataBr = '';
      if (a.data) {
        const strData = a.data instanceof Date ? a.data.toISOString() : String(a.data);
        const matchData = strData.match(/\d{4}-\d{2}-\d{2}/);
        if (matchData) {
          dataBr = matchData[0].split('-').reverse().join('/');
        }
      }

      // 2. Extração segura do relógio (HH:mm) via Regex (elimina o bug "hu Ja")
      let horarioFormatado = '';
      if (a.horario) {
        const strHorario = a.horario instanceof Date ? a.horario.toISOString() : String(a.horario);
        const matchHora = strHorario.match(/\d{2}:\d{2}/);
        horarioFormatado = matchHora ? matchHora[0] : '';
      }

      return {
        ...a,
        motivo: a.motivo || 'Atendimento',
        data_br: dataBr,
        horario: horarioFormatado,
      };
    });

    return {
      cidadao,
      agendamentos,
    };
  }

  @UseGuards(CidadaoGuard)
  @Patch('agendamentos/:id/cancelar')
  async cancelarAgendamento(
    @Param('id', ParseIntPipe) id: number, 
    @Req() req: Request
  ) {
    const cidadaoId = req.session?.cidadaoId || req.session?.usuario?.id;
    if (!cidadaoId) throw new UnauthorizedException('Sessão inválida ou expirada.');

    return await this.prisma.$transaction(async (tx) => {
      const agendamento = await tx.agendamentos.findFirst({
        where: { id, cidadao_id: cidadaoId, status: 'pedido_pendente' },
      });

      if (!agendamento) {
        throw new NotFoundException('Agendamento não encontrado ou não pode mais ser cancelado.');
      }

      await tx.agendamentos.update({
        where: { id },
        data: { status: 'cancelado' },
      });

      await tx.agendamento_slots.deleteMany({
        where: { agendamento_id: id },
      });

      return { sucesso: true, mensagem: 'Agendamento cancelado com sucesso.' };
    });
  }
}