export type ServiceErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "UNAUTHENTICATED"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_STATE"
  | "UNAVAILABLE";

/**
 * Erro de domínio retornado pelos serviços. A mensagem é amigável e pode ser
 * exibida diretamente ao usuário. Na Fase 2, as respostas da API serão
 * convertidas para este mesmo formato.
 */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function getErrorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (error instanceof ServiceError) return error.message;
  return fallback;
}

