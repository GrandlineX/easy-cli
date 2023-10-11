import { CoreLogChannel } from '@grandlinex/core';
import { IArgs, ParamType } from '../lib/types.js';
import { ShellCommand } from '../class/ShellComand.js';

export default class ArgUtil {
  static printDebug(log: CoreLogChannel, args: IArgs) {
    log.debug(`Parameter length: ${args.getLength()}`);
    log.debug(`Cmd List: ${args.getCmdList().join(' ')}`);
    args.getParameters().forEach((value, key) => {
      log.debug(`Parameter: ${key} = ${value} (${typeof value})`);
    });
  }

  static buildCmd(cmd: ShellCommand, args: IArgs) {
    const param = args.getParameters().map((value, key) => {
      if (value === null) {
        return `--${key}`;
      }
      return `--${key}=${value}`;
    });
    cmd.info(
      `CMD -> ${
        cmd.handler.isDev()
          ? 'ts-node-esm .\\src\\cli.ts'
          : cmd.handler.getCmdName()
      } ${args.getCmdList().join(' ')} ${param.join(' ')}`,
    );
  }

  /**
   * Check if a parameter is a specific type
   * @param name
   * @param type
   * @param args The arguments
   */
  static isParameterType(args: IArgs, name: string, type: ParamType): boolean {
    const check = this.checkParameterType(args, name);
    if (check === null) {
      return false;
    }
    if (type === 'path') {
      return check === 'string';
    }
    return type === check;
  }

  /**
   * Get the value of a parameter
   * @param args The arguments
   * @param name The name of the parameter
   */
  static checkParameterType(args: IArgs, name: string): ParamType | null {
    if (!args.getParameters().has(name)) {
      return null;
    }
    const val = args.getParameters().get(name);
    switch (typeof val) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'null';
    }
  }
}
