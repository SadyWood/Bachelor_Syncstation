declare module 'uuid' {
  export function v7(): string;
  export function v4(): string;
  export function v1(): string;
  export function v3(
    name: string | ArrayLike<number>,
    namespace: string | ArrayLike<number>,
  ): string;
  export function v5(
    name: string | ArrayLike<number>,
    namespace: string | ArrayLike<number>,
  ): string;
  export function validate(uuid: string): boolean;
  export function parse(uuid: string): Uint8Array;
  export function stringify(arr: ArrayLike<number>, offset?: number): string;
}
