import Path from 'path';
import fs from 'fs';
import { CoreLogChannel, CoreLogger } from '@grandlinex/core';
import { CmdProperty, IArgs, IHandler, ParamTypeRaw } from '../lib/types.js';
import ArgUtil from '../utils/ArgUtil.js';

export type ShellCommandParentProps = {
  logger: CoreLogger;
  handler: IHandler;
};
export type ShellCommandProps = {
  name: string;
  description: string;
  properties: CmdProperty[];
  subCommands?: ShellCommand[];
  level?: number;
} & ShellCommandParentProps;
export abstract class ShellCommand<T = any> extends CoreLogChannel {
  name: string;

  level: number;

  description: string;

  handler: IHandler<T>;

  properties: CmdProperty[];

  subCommands: ShellCommand[];

  protected constructor(conf: ShellCommandProps) {
    super(conf.name, conf.logger);
    this.name = conf.name;
    this.description = conf.description;
    this.handler = conf.handler;
    this.properties = conf.properties;
    this.subCommands = conf.subCommands || [];
    this.level = conf.level || 0;
  }

  private async validateFields(args: IArgs): Promise<boolean> {
    for (const { key, type, required, options } of this.properties) {
      const p = args.getParameters().get(key);
      if (!ArgUtil.isParameterType(args, key, type) && p !== undefined) {
        throw this.lError(
          `Parameter --${key} is not valid. Got ${p} as ${ArgUtil.checkParameterType(
            args,
            key,
          )} but expected ${type}`,
        );
      }
      if (required && ArgUtil.checkParameterType(args, key) === null) {
        throw this.lError(`Parameter --${key} is not set but required`);
      }
      if (options && p !== undefined && !options.find((o) => o.key === p)) {
        throw this.lError(`Parameter --${key} has invalid option ${p}`);
      }
    }
    for (const k of args.getParameters().toKeyArray()) {
      if (!this.properties.find(({ key }) => key === k)) {
        throw this.lError(`Unknown Parameter --${k}`);
      }
    }
    return true;
  }

  async start(parser: IArgs): Promise<boolean> {
    const next = this.level + 1;
    if (parser.getCmdList().length > next) {
      const sub = this.subCommands.find(
        (c) => c.name === parser.getCmdList()[next],
      );
      if (sub) {
        return sub.start(parser);
      }
      throw this.lError(`Unknown Sub-Command ${parser.getCmdList().join(' ')}`);
    }
    await this.validateFields(parser);
    const ext = await this.run(parser);
    this.handler.onEnd();
    return ext;
  }
  abstract run(parser: IArgs): Promise<boolean>;

  protected resolvePath(path?: ParamTypeRaw) {
    if (!path || typeof path !== 'string') {
      throw this.lError(`Invalid path ${path}`);
    }
    const absPath = Path.resolve(path);
    if (!fs.existsSync(absPath)) {
      throw this.lError(`File ${absPath} does not exist`);
    }
    return absPath;
  }
}
