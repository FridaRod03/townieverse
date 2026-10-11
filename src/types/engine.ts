export type ErrorCode =
  | 'INVALID_CONFIG'
  | 'INVALID_DATA'
  | 'INVALID_WEIGHT'
  | 'EMPTY_POOL'
  | 'INCOMPATIBLE_AGE'
  | 'INVALID_HOUSEHOLD'
  | 'CONTENT_RESTRICTED'
  | 'LOCK_CONFLICT'
  | 'INVALID_RANDOM';
export interface EngineError {
  code: ErrorCode;
  message: string;
  details: string[];
}
export type EngineResult<T> =
  { success: true; value: T } | { success: false; error: EngineError };
export type RandomSource = () => number;
export const success = <T>(value: T): EngineResult<T> => ({
  success: true,
  value,
});
export const failure = <T = never>(
  code: ErrorCode,
  message: string,
  details: string[] = [],
): EngineResult<T> => ({ success: false, error: { code, message, details } });
