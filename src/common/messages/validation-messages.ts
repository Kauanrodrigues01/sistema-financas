export const validationMessages = {
  EMAIL: {
    INVALID: 'O email fornecido não é válido.',
    ALREADY_IN_USE: 'Email já está em uso',
  } as const,
  USER: {
    NOT_FOUND: (id: number): string => `Usuário com ID ${id} não encontrado`,
  } as const,
  AUTH: {
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    USER_NOT_FOUND: 'Usuário não encontrado',
    NOT_AUTHENTICATED: 'Usuário não autenticado',
    ACCESS_DENIED_ADMIN_ONLY:
      'Acesso negado. Apenas administradores podem acessar este recurso.',
  } as const,
  NOT_EMPTY: (field: string): string => `${field} não deve estar vazio.`,
  IS_STRING: (field: string): string => `${field} deve ser uma string.`,
  MIN_LENGTH: (min: number): string =>
    `Este campo deve ter pelo menos ${min} caracteres.`,
  MAX_LENGTH: (max: number): string =>
    `Este campo deve ter no máximo ${max} caracteres.`,
} as const;
