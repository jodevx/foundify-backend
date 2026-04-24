import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT opcional: si hay token lo verifica y rellena req.user,
 * si no hay token (o es inválido) simplemente deja pasar sin error.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
