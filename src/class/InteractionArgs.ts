import { CMap } from '@grandlinex/core';
import { IArgs, ParamTypeRaw } from '../lib/types.js';

export default class InteractionArgs implements IArgs {
  cmd: string[];

  param: CMap<string, ParamTypeRaw>;

  constructor() {
    this.cmd = [];
    this.param = new CMap();
  }

  getCmdList(): string[] {
    return this.cmd;
  }

  getLength(): number {
    return this.param.size;
  }

  getParameters(): CMap<string, ParamTypeRaw> {
    return this.param;
  }

  getParameter<T = ParamTypeRaw | undefined>(key: string): T {
    return this.param.get(key) as T;
  }
}
