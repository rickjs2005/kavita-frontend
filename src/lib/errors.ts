// src/lib/errors.ts

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  mensagem?: string; // compat
  details?: unknown;
  requestId?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  requestId?: string;
  url?: string;

  constructor(args: {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
    requestId?: string;
    url?: string;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.requestId = args.requestId;
    this.url = args.url;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as any).name === "ApiError" &&
    typeof (err as any).status === "number"
  );
}
