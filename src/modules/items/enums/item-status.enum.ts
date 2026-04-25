export const VALID_STATUSES = {
  lost_item: [
    'reportado_perdido',
    'en_validacion',
    'recuperado',
    'cerrado_sin_recuperar',
  ],
  found_item: [
    'reportado_encontrado',
    'en_resguardo',
    'en_validacion',
    'devuelto_propietario',
    'entregado_autoridad',
    'cerrado_sin_reclamo',
  ],
} as const;

export const INITIAL_STATUS = {
  lost_item: 'reportado_perdido',
  found_item: 'reportado_encontrado',
} as const;

export const CLOSED_STATUSES_FOUND_ITEM = [
  'devuelto_propietario',
  'entregado_autoridad',
  'cerrado_sin_reclamo',
];

// Transiciones permitidas: status_actual → [status_siguientes]
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  reportado_perdido: ['en_validacion', 'recuperado', 'cerrado_sin_recuperar'],
  en_validacion: ['recuperado', 'cerrado_sin_recuperar', 'en_resguardo'],
  reportado_encontrado: [
    'en_resguardo',
    'devuelto_propietario',
    'entregado_autoridad',
    'cerrado_sin_reclamo',
  ],
  en_resguardo: [
    'devuelto_propietario',
    'entregado_autoridad',
    'cerrado_sin_reclamo',
  ],
};
