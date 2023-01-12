export type AnyFunction = (...args: any) => any;

export interface AnyObject {
  [key: string]: any;
  [key: number]: any;
}
