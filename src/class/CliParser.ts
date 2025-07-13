import { CMap, CoreLogChannel, CoreLogger } from '@grandlinex/core';
import { IArgs, ParamTypeRaw } from '../lib/types.js';

export default class CliParser extends CoreLogChannel implements IArgs {
  private readonly parameter: CMap<string, ParamTypeRaw>;

  private cmdList: string[];

  private argV: string[];

  constructor(logger: CoreLogger, args?: string[]) {
    super('parser', logger);
    this.parameter = new CMap();
    this.cmdList = [];
    if (args) {
      this.argV = args;
    } else {
      const { argv } = process;
      const arg = argv;
      arg.shift();
      arg.shift();
      this.argV = arg;
    }
    this.parse();
  }

  /**
   * Convert a string to a value
   * @param val
   * @private
   */
  private convertValue(val: string): [string, ParamTypeRaw] {
    const split = val.split('=');
    const k = split[0];
    if (split.length === 1) {
      return [k.substring(2), null];
    }
    const r = split.splice(1).join('=');
    if (r === 'true') {
      return [k.substring(2), true];
    }
    if (r === 'false') {
      return [k.substring(2), false];
    }
    try {
      const n = Number(r);
      if (!Number.isNaN(n)) {
        return [k.substring(2), n];
      }
    } catch (e) {
      // ignore
    }
    if (/^'.*'$/gm.test(r)) {
      return [k.substring(2), r.substring(1, r.length - 1)];
    }
    return [k.substring(2), r];
  }

  /**
   * Parse the arguments
   * @private
   */
  private parse() {
    let isCmd = true;
    this.argV.forEach((value) => {
      if (value.startsWith('--')) {
        isCmd = false;
      }
      if (isCmd && value.startsWith('--')) {
        throw this.lError(
          `Invalid option: ${value}. For cmd ${this.argV.join(' ')}`,
        );
      }
      if (isCmd && !value.startsWith('--')) {
        this.cmdList.push(value);
        return;
      }
      if (!isCmd && value.startsWith('--')) {
        const [k, v] = this.convertValue(value);
        if (this.parameter.has(k)) {
          throw this.lError(
            `Duplicated option: ${value}. For cmd ${this.argV.join(' ')}`,
          );
        }
        this.parameter.set(k, v);
        return;
      }
      throw this.lError(
        `Invalid option: ${value}. For cmd ${this.argV.join(' ')}`,
      );
    });
  }

  /**
   * Get the command list
   */
  getCmdList() {
    return this.cmdList;
  }

  /**
   * Get the length of the parameter map
   */
  getLength() {
    return this.parameter.size;
  }

  /**
   * Get the parameter map
   */
  getParameters() {
    return this.parameter;
  }

  /**
   * Get the parameter
   * @param key
   */
  getParameter<T = ParamTypeRaw | undefined>(key: string): T {
    return this.parameter.get(key) as T;
  }

  /**
   * Get the null parameter as a boolean
   * @param key
   */
  getParameterNull(key: string): boolean {
    return this.parameter.get(key) === null;
  }
}
