import type { ReactNode } from "react";

export type AnyFunction = (...args: any) => any;

export interface AnyObject {
  [key: string]: any;
  [key: number]: any;
}

export type Children = Array<ReactNode> | ReactNode;
