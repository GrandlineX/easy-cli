import { CMap } from '@grandlinex/core';
import { ShellCommand } from '../class/ShellComand.js';

export type ParamType = 'string' | 'number' | 'boolean' | 'path' | 'null';
export type ParamTypeRaw = number | boolean | string | null;

export interface IHandler {
  /**
   * Get the command list
   */
  getCmds(full?: boolean): ShellCommand[];

  /**
   * Get the script name
   */
  getCmdName(): string;

  /**
   * Get the dev mode state
   */
  isDev(): boolean;

  /**
   * Get the default interactive page size
   */
  getPageSize(): number | undefined;
}

export interface IArgs {
  /**
   * Get the command list
   */
  getCmdList(): string[];

  /**
   * Get the length of the parameter map
   */
  getLength(): number;

  /**
   * Get the parameter map
   */
  getParameters(): CMap<string, ParamTypeRaw>;
  /**
   * Get the parameter
   */
  getParameter<T extends ParamTypeRaw | undefined = ParamTypeRaw | undefined>(
    key: string,
  ): T;
  /**
   * Get the null parameter as a boolean
   */
  getParameterNull(key: string): boolean;
}

export type BaseCMDProperty = {
  /**
   * The key of the parameter
   */
  key: string;
  /**
   * Is the parameter required
   */
  required: boolean;
  /**
   * The description of the parameter
   */
  description?: string;
  /**
   * The default value of the parameter
   */
  default?: ParamTypeRaw | (() => Promise<ParamTypeRaw>);
  /**
   * Validate the parameter
   * @param input The input value
   */
  validate?(input: ParamTypeRaw): boolean | string;
  /**
   * The options of the parameter
   */
  options?: {
    key: ParamTypeRaw;
    description?: string;
  }[];
};
export type SimpleCMDProp = BaseCMDProperty & {
  type: 'boolean' | 'null';
};
export type NumberCMDProp = BaseCMDProperty & {
  type: 'number';
  /**
   * Open the editor for the parameter
   */
  editor?: boolean;
};
export type StringCMDProp = BaseCMDProperty & {
  type: 'string';
  /**
   * Open the editor for the parameter
   */
  editor?: boolean;
  prefill?: 'tab' | 'editable';
};
export type PathCMDProp = BaseCMDProperty & {
  type: 'path';
  /**
   * If true, the path is a file only
   */
  fileOnly?: boolean;
  /**
   * If true, the path is a directory only
   */
  dirOnly?: boolean;
};
export type CmdProperty =
  | SimpleCMDProp
  | PathCMDProp
  | NumberCMDProp
  | StringCMDProp;

export async function getBoolOrUndefined(
  val: unknown,
  fallback: boolean | undefined = undefined,
): Promise<boolean | undefined> {
  let v = val;
  if (typeof val === 'function') {
    v = val();
  }
  if (typeof v === 'boolean') {
    return v;
  }
  return fallback;
}

export async function getStringOrUndefined(
  val: unknown,
  fallback: string | undefined = undefined,
): Promise<string | undefined> {
  let v = val;
  if (typeof val === 'function') {
    v = val();
  }
  if (typeof v === 'string') {
    return v;
  }
  return fallback;
}

export async function getNumberOrUndefined(
  val: unknown,
  fallback: number | undefined = undefined,
): Promise<number | undefined> {
  let v = val;
  if (typeof val === 'function') {
    v = val();
  }
  if (typeof v === 'number') {
    return v;
  }
  return fallback;
}
