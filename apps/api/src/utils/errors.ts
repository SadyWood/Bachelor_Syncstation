// Internal error helper type (not exported - implementation detail)
type ErrorBody = { ok: false; code: string; message: string; details?: Record<string, unknown> };

export const err = (
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorBody => ({ ok: false, code, message, ...(details ? { details } : {}) });
