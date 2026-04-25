export const VALID_STATUSES = {
  lost_item: [
    'reportado_perdido',
    'recuperado',
    'cerrado_sin_recuperar',
  ],
  found_item: [
    'reportado_encontrado',
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

export const CLOSED_STATUSES_LOST_ITEM = [
  'recuperado',
  'cerrado_sin_recuperar',
];

// Transiciones permitidas: status_actual → [status_siguientes]
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  reportado_perdido: ['recuperado', 'cerrado_sin_recuperar'],
  recuperado: ['reportado_perdido'],
  cerrado_sin_recuperar: ['reportado_perdido'],
  en_validacion: [],
  reportado_encontrado: [
    'devuelto_propietario',
    'entregado_autoridad',
    'cerrado_sin_reclamo',
  ],
  devuelto_propietario: ['reportado_encontrado'],
  entregado_autoridad: ['reportado_encontrado'],
  cerrado_sin_reclamo: ['reportado_encontrado'],
};
