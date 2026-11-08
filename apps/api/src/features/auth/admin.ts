import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';

/** ADMIN_EMAILS: emails separados por coma. Se lee en cada pedido (cambiarlo no requiere redeploy del código). */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Va después de SessionGuard. A quien no es admin le responde 404: ni se entera de que la ruta existe. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: { email: string } }>().user;
    if (!user || !isAdminEmail(user.email)) throw new NotFoundException({ error: 'not_found' });
    return true;
  }
}
