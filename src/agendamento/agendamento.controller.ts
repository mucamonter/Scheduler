import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Req, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HORARIOS, diaUtil, hoje } from '../common/utils/helpers';
import { dataValida } from '../common/utils/date.util';

@Controller('agendamentos') // Prefixo da rota: /api/agendamentos
export class AgendamentoController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Rota GET: /api/agendamentos/disponiveis
  @Get('disponiveis')
  async horariosDisponiveis(@Query('data') data?: string) {
    if (!data || !dataValida(data)) throw new BadRequestException('Data inválida.');
    if (!diaUtil(data)) return { horariosOcupados: [], horariosDisponiveis: [] };

    const dataFormatada = new Date(`${data}T00:00:00Z`);
    const slotsOcupados = await this.prisma.agendamento_slots.findMany({
      where: { data: dataFormatada },
      select: { horario_inicio: true }
    });

    const horariosOcupados = slotsOcupados.map(s => 
      s.horario_inicio.toISOString().substring(11, 16)
    );

    const horariosDisponiveis = HORARIOS.filter(h => !horariosOcupados.includes(h));

    return { horariosOcupados, horariosDisponiveis };
  }

  // 2. Rota POST pública para o Cidadão: /api/agendamentos
  @Post() // Sem parâmetro string = responde diretamente em POST /api/agendamentos
  async criarAgendamentoCidadao(@Body() body: any, @Req() req: any) {
    const nome = (body.nome || req.session?.cidadaoNome || '').trim();
    const email = (body.email || req.session?.cidadaoEmail || '').trim().toLowerCase();
    const motivo = (body.motivo || '').trim();
    const dataStr = (body.data || '').trim();
    const horario = (body.horario || '').trim();
    const cidadaoId = req.session?.cidadaoId || req.session?.usuario?.id;

    if (!nome || !motivo || !dataStr || !horario) {
      throw new BadRequestException('Nome, motivo, data e horário são obrigatórios.');
    }

    if (!dataValida(dataStr) || dataStr < hoje() || !diaUtil(dataStr)) {
      throw new BadRequestException('Data inválida ou fora do expediente.');
    }

    const dataFormatada = new Date(`${dataStr}T00:00:00Z`);
    const horarioFormatado = horario.length === 5 ? `${horario}:00` : horario;
    const horarioData = new Date(`${dataStr}T${horarioFormatado}Z`);

    try {
      const novoAgendamento = await this.prisma.$transaction(async (tx) => {
        return await tx.agendamentos.create({
          data: {
            nome,
            email: email || null,
            motivo,
            data: dataFormatada,
            horario: horarioData,
            status: 'pedido_pendente',
            atendimento: 'marcado',
            tipo_atendimento: 'unico',
            ...(cidadaoId && {
              cidadaos: { connect: { id: cidadaoId } }
            }),
            agendamento_slots: {
              create: [{ data: dataFormatada, horario_inicio: horarioData }]
            },
            agendamento_participantes: {
              create: [{ nome, principal: true }]
            }
          }
        });
      });

      return { sucesso: true, id: novoAgendamento.id, mensagem: 'Pedido registrado com sucesso.' };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Este horário acabou de ser preenchido por outro usuário.');
      }
      throw e;
    }
  }
}