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
   * Get the parameter map
   */
  getParameter<T extends ParamTypeRaw | undefined = ParamTypeRaw | undefined>(
    key: string,
  ): T;
}

export type CmdProperty = {
  /**
   * The key of the parameter
   */
  key: string;
  /**
   * The type of the parameter
   */
  type: ParamType;
  /**
   * Is the parameter required
   */
  required: boolean;
  /**
   * Open the editor for the parameter
   */
  editor?: boolean;
  /**
   * The description of the parameter
   */
  description?: string;
  /**
   * The default value of the parameter
   */
  default?: ParamTypeRaw;
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
