import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  UnauthorizedException, 
  ForbiddenException 
} from '@nestjs/common';

@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const papel = req.session?.papel;

    // 1. Verifica se existe uma sessão ativa
    if (!papel) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    // 2. Permite acesso a Administradores, Balconistas e Visualizadores
    const papeisPermitidos = ['admin', 'balconista', 'visualizador'];
    if (!papeisPermitidos.includes(papel)) {
      throw new ForbiddenException('Acesso negado.');
    }

    return true;
  }
}