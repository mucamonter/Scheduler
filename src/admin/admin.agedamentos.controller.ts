import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  UseGuards, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StaffGuard } from '../common/guards/staff.guard';

@UseGuards(StaffGuard)
// Como o main.ts possui app.setGlobalPrefix('api'), a URL base é /api/admin/agendamentos
@Controller('admin/agendamentos')
export class AdminAgendamentosController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. GET /api/admin/agendamentos (LISTAGEM COM TODOS OS FILTROS)
  @Get()
  async listar(
    @Query('busca') busca?: string,
    @Query('data') data?: string,
    @Query('status') status?: string,
    @Query('atendimento') atendimento?: string,
  ) {
    const where: any = {};

    // Filtro por Data
    if (data) {
      const inicioDia = new Date(`${data}T00:00:00.000Z`);
      const fimDia = new Date(`${data}T23:59:59.999Z`);
      where.data = { gte: inicioDia, lte: fimDia };
    }

    // Filtro por Status
    if (status) {
      where.status = status;
    }

    // Filtro por Tipo de Atendimento
    if (atendimento) {
      where.atendimento = atendimento;
    }

    // Filtro por Texto (Nome, E-mail, Telefone, Endereço, Motivo, Tratativa)
    if (busca && busca.trim() !== '') {
      const termo = busca.trim();
      where.OR = [
        { nome: { contains: termo } },
        { email: { contains: termo } },
        { telefone: { contains: termo } },
        { endereco: { contains: termo } },
        { motivo: { contains: termo } },
        { tratativa: { contains: termo } },
      ];
    }

    const agendamentos = await this.prisma.agendamentos.findMany({
      where,
      orderBy: { data: 'desc' },
    });

    return { agendamentos };
  }

  // 2. PATCH /api/admin/agendamentos/:id (ATUALIZAÇÃO DE STATUS E TRATATIVA)
  @Patch(':id')
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body() body: any
  ) {
    const agendamento = await this.prisma.agendamentos.findUnique({ where: { id } });
  if (!agendamento) {
    throw new NotFoundException(`Agendamento com ID ${id} não encontrado.`);
  }

    const statusValidos = ['pedido_pendente', 'pedido_atendido', 'pedido_nao_atendido', 'cancelado'];

    if (body.status && !statusValidos.includes(body.status)) {
    throw new BadRequestException(
      `Status inválido ('${body.status}'). Os valores permitidos são: ${statusValidos.join(', ')}`
    );
  }

    if (!agendamento) {
      throw new NotFoundException(`Agendamento com ID ${id} não encontrado.`);
    }

   const agendamentoAtualizado = await this.prisma.agendamentos.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.tratativa !== undefined && { tratativa: body.tratativa }),
      ...(body.nome && { nome: body.nome }),
      ...(body.telefone !== undefined && { telefone: body.telefone }),
      ...(body.endereco !== undefined && { endereco: body.endereco }),
      ...(body.motivo && { motivo: body.motivo }),
      ...(body.atendimento && { atendimento: body.atendimento }),
      ...(body.data && { data: new Date(`${body.data}T00:00:00.000Z`) }),
    },
  });

    return {
      sucesso: true,
      mensagem: 'Atendimento atualizado com sucesso.',
      agendamento: agendamentoAtualizado,
    };
  }

  // 3. POST /api/admin/agendamentos (CRIAR NOVO PELO ADMIN)
  @Post()
  async criarPeloAdmin(@Body() body: any) {
    if (!body.nome || !body.motivo || !body.data) {
      throw new BadRequestException('Nome, motivo e data são obrigatórios.');
    }

    const novo = await this.prisma.agendamentos.create({
      data: {
        nome: body.nome.trim(),
        email: body.email ? body.email.trim() : null,
        telefone: body.telefone ? body.telefone.trim() : null,
        endereco: body.endereco ? body.endereco.trim() : null,
        motivo: body.motivo.trim(),
        status: body.status || 'pedido_pendente',
        atendimento: body.atendimento || 'no_paco',
        tipo_atendimento: body.tipo_atendimento || 'unico',
        data: new Date(`${body.data}T00:00:00.000Z`),
        ...(body.horario && { 
          horario: new Date(`${body.data}T${body.horario.length === 5 ? body.horario + ':00' : body.horario}Z`) 
        }),
      },
    });

    return {
      sucesso: true,
      id: novo.id,
      mensagem: 'Agendamento registrado com sucesso.',
    };
  }

  // 4. DELETE /api/admin/agendamentos/:id (REMOVER)
  @Delete(':id')
  async excluir(@Param('id', ParseIntPipe) id: number) {
    const agendamento = await this.prisma.agendamentos.findUnique({ where: { id } });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado.');

    await this.prisma.agendamentos.delete({ where: { id } });

    return { sucesso: true, mensagem: 'Agendamento removido com sucesso.' };
  }
}