import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ClaimAction {
  aceptado = 'aceptado',
  rechazado = 'rechazado',
}

export class ManageClaimDto {
  @IsEnum(ClaimAction, {
    message: 'La acción debe ser "aceptado" o "rechazado"',
  })
  @IsNotEmpty()
  action: ClaimAction;
}
