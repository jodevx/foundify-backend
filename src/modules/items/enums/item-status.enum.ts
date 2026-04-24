export const VALID_STATUSES = {
  perdido: [
    'reportado_perdido',
    'en_validacion',
    'recuperado',
    'cerrado_sin_recuperar',
  ],
  encontrado: [
    'reportado_encontrado',
    'en_resguardo',
    'en_validacion',
    'devuelto_propietario',
    'entregado_autoridad',
    'cerrado_sin_reclamo',
  ],
} as const;

export const INITIAL_STATUS = {
  perdido: 'reportado_perdido',
  encontrado: 'reportado_encontrado',
} as const;

export const CLOSED_STATUSES_ENCONTRADO = [
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
