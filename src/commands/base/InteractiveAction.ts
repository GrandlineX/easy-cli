import fs from 'fs';

import { confirm, editor, input, number, select } from '@inquirer/prompts';
import {
  ShellCommand,
  ShellCommandParentProps,
} from '../../class/ShellComand.js';
import InteractionArgs from '../../class/InteractionArgs.js';
import ArgUtil from '../../utils/ArgUtil.js';
import {
  getBoolOrUndefined,
  getNumberOrUndefined,
  getStringOrUndefined,
  ParamTypeRaw,
  PathCMDProp,
} from '../../lib/types.js';

export default class InteractiveAction extends ShellCommand {
  constructor(props: ShellCommandParentProps) {
    super({
      ...props,
      name: 'interactive',
      description: 'Use the interactive mode',
      properties: [
        {
          key: 'interactive',
          type: 'null',
          required: true,
        },
      ],
    });
  }

  private getFileOption(prop: PathCMDProp) {
    const path = this.resolvePath('.');
    const files = fs.readdirSync(path, { withFileTypes: true });
    return files
      .filter((f) => {
        if (prop.fileOnly) {
          return f.isFile();
        }
        if (prop.dirOnly) {
          return f.isDirectory();
        }
        return true;
      })
      .map((f) => ({
        name:
          !prop.fileOnly && !prop.dirOnly
            ? `[${f.isFile() ? 'File' : 'Dir'}] ${f.name}`
            : f.name,
        value: f.name,
        disabled: false,
        isDir: f.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDir && !b.isDir) {
          return -1;
        }
        if (!a.isDir && b.isDir) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  private async runCmd(
    sel: ShellCommand,
    args: InteractionArgs,
  ): Promise<boolean> {
    sel.properties
      .filter(({ type, required }) => type === 'null' && required)
      .forEach(({ key }) => {
        args.param.set(key, null);
      });

    const uParam = sel.properties.filter(
      ({ type, required }) => type !== 'null' || !required,
    );

    const validation = async (cnf: {
      promise: () => Promise<ParamTypeRaw | undefined>;
      after?: (data: ParamTypeRaw | undefined) => ParamTypeRaw | undefined;
      validate?: (data: ParamTypeRaw) => boolean | string;
    }) => {
      const { promise, after, validate } = cnf;
      let valid = false;
      let data: ParamTypeRaw | undefined;

      while (!valid) {
        data = await promise();
        if (validate && data !== undefined) {
          const validated = validate(data);
          if (validated === true) {
            valid = true;
          } else if (typeof validated === 'string') {
            this.error(validated);
          } else {
            this.error('Invalid input');
          }
        } else {
          valid = true;
        }
      }
      if (after && data !== undefined) {
        return after(data);
      }
      return data;
    };
    if (uParam.length > 0) {
      const options: Record<string, any> = {};

      // eslint-disable-next-line no-unreachable-loop
      for (const prop of uParam) {
        switch (prop.type) {
          case 'null':
            options[prop.key] = await validation({
              promise: () =>
                confirm({
                  message: prop.description ?? prop.key,
                  default: getBoolOrUndefined(prop.default, false),
                }),
              validate: prop.validate,
            });
            break;
          case 'path':
            options[prop.key] = await validation({
              promise: () =>
                select({
                  message: prop.description ?? prop.key,
                  choices: this.getFileOption(prop),
                  default: getStringOrUndefined(prop.default),
                  pageSize: this.handler.getPageSize(),
                }),
              validate: prop.validate,
            });
            break;
          case 'number':
            if (prop.editor) {
              options[prop.key] = await validation({
                promise: () =>
                  editor({
                    message: prop.description ?? prop.key,
                    default: getStringOrUndefined(prop.default),
                  }),
                validate: prop.validate,
              });
            } else {
              options[prop.key] = await validation({
                promise: () =>
                  number({
                    message: prop.description ?? prop.key,
                    default: getNumberOrUndefined(prop.default),
                  }),
                validate: (ip: ParamTypeRaw) => {
                  if (prop.validate) {
                    return prop.validate(ip);
                  }
                  return !prop.required || !Number.isNaN(Number(ip));
                },
              });
            }
            break;
          case 'string':
            if (!prop.options) {
              if (prop.editor) {
                options[prop.key] = await validation({
                  promise: () =>
                    editor({
                      message: prop.description ?? prop.key,
                      default: getStringOrUndefined(prop.default),
                    }),
                  validate: (ip) => {
                    if (prop.validate) {
                      return prop.validate(ip);
                    }
                    return (
                      !prop.required || getStringOrUndefined(ip, '')!.length > 0
                    );
                  },
                });
              } else {
                options[prop.key] = await validation({
                  promise: () =>
                    input({
                      message: prop.description ?? prop.key,
                      default: getStringOrUndefined(prop.default),
                      prefill: prop.prefill,
                    }),
                  validate: (ip) => {
                    if (prop.validate) {
                      return prop.validate(ip);
                    }
                    return (
                      !prop.required || getStringOrUndefined(ip, '')!.length > 0
                    );
                  },
                });
              }
            } else {
              options[prop.key] = await validation({
                promise: () =>
                  select({
                    message: prop.description ?? prop.key,
                    default: getStringOrUndefined(prop.default),
                    choices:
                      prop.options?.map((o) => ({
                        name: `${o.key} - ${o.description}`,
                        value: o.key,
                        disabled: false,
                      })) ?? [],
                    pageSize: this.handler.getPageSize(),
                  }),
                validate: prop.validate,
              });
            }

            break;
          default:
            options[prop.key] = await validation({
              promise: () =>
                select({
                  message: prop.description ?? prop.key,
                  default: getStringOrUndefined(prop.default),
                  choices: [],
                  pageSize: this.handler.getPageSize(),
                }),
              validate: prop.validate,
            });
        }
      }
      this.debug(JSON.stringify(options));
      uParam.forEach(({ key, type }) => {
        switch (type) {
          case 'null':
            if (options[key]) {
              args.param.set(key, null);
            }
            break;
          case 'number':
            if (options[key] !== '') {
              args.param.set(key, Number(options[key]));
            }
            break;
          case 'string':
          case 'path':
            if (options[key] !== '') {
              args.param.set(key, options[key]);
            }
            break;
          default:
        }
      });
    }

    ArgUtil.printDebug(this, args);
    ArgUtil.buildCmd(this, args);
    return sel.run(args);
  }

  private async checkForSubCmd(
    cmd: ShellCommand,
    args: InteractionArgs,
  ): Promise<boolean> {
    args.cmd.push(cmd.name);
    if (cmd.subCommands.length > 0) {
      const next = await select({
        message: `Select your action: > ${args.cmd.join(' > ')}`,
        pageSize: this.handler.getPageSize(),
        choices: cmd.subCommands.map((c) => ({
          name: `${c.name} - ${c.description}`,
          value: c.name,
          disabled: false,
        })),
      });

      const sel = cmd.subCommands.find((c) => c.name === next)!;
      return this.checkForSubCmd(sel, args);
    }
    return this.runCmd(cmd, args);
  }

  async run(): Promise<boolean> {
    const cmdList = this.handler.getCmds(true);
    const cmd = await select({
      message: 'Select your action',
      pageSize: this.handler.getPageSize(),
      choices: cmdList
        .filter((e) => e.name !== 'interactive')
        .map((c) => ({
          name: `${c.name} - ${c.description}`,
          value: c.name,
          disabled: false,
        })),
    });

    const sel = cmdList.find((c) => c.name === cmd)!;

    const args = new InteractionArgs();
    return this.checkForSubCmd(sel, args);
  }
}
