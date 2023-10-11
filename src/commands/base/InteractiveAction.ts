import fs from 'fs';
import inquirer, { DistinctQuestion } from 'inquirer';
import {
  ShellCommand,
  ShellCommandParentProps,
} from '../../class/ShellComand.js';
import InteractionArgs from '../../class/InteractionArgs.js';
import ArgUtil from '../../utils/ArgUtil.js';

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

  private getFileOption() {
    const path = this.resolvePath('.');
    const files = fs.readdirSync(path, { withFileTypes: true });
    return files
      .filter((f) => f.isFile())
      .map((f) => ({
        name: `${f.name}`,
        value: f.name,
        disabled: false,
      }));
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
    const opt = uParam
      .map<DistinctQuestion>((prop) => {
        switch (prop.type) {
          case 'null':
            return {
              name: prop.key,
              type: 'confirm',
              message: prop.description,
              default: prop.default || false,
              validate: prop.validate,
            };
          case 'path':
            return {
              name: prop.key,
              type: 'list',
              message: prop.description,
              choices: this.getFileOption(),
              default: prop.default,
              validate: prop.validate,
            };
          case 'number':
            return {
              name: prop.key,
              type: prop.editor ? 'editor' : 'input',
              validate: (input) => {
                if (prop.validate) {
                  return prop.validate(input);
                }
                return (
                  !prop.required ||
                  (input.length > 0 && !Number.isNaN(Number(input)))
                );
              },
              message: prop.description,
              default: prop.default,
            };
          case 'string':
            if (!prop.options)
              return {
                name: prop.key,
                type: prop.editor ? 'editor' : 'input',
                validate: (input) => {
                  if (prop.validate) {
                    return prop.validate(input);
                  }
                  return !prop.required || input.length > 0;
                },
                message: prop.description,
                default: prop.default,
              };
            return {
              name: prop.key,
              type: 'list',
              message: prop.description,
              choices: prop.options.map((o) => ({
                name: `${o.key} - ${o.description}`,
                value: o.key,
                disabled: false,
              })),
              default: prop.default,
              validate: prop.validate,
            };
          default:
            return {
              name: 'actionSelect',
              type: 'list',
              message: 'Select your action',
              choices: [],
              default: prop.default,
              validate: prop.validate,
            };
        }
      })
      .map((q) => ({ ...q, pageSize: this.handler.getPageSize() }));

    if (opt.length > 0) {
      const options = await inquirer.prompt(opt);
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
      const next = await inquirer.prompt({
        name: 'actionSelect',
        type: 'list',
        message: `Select your action: > ${args.cmd.join(' > ')}`,
        pageSize: this.handler.getPageSize(),
        choices: cmd.subCommands.map((c) => ({
          name: `${c.name} - ${c.description}`,
          value: c.name,
          disabled: false,
        })),
      });
      const select = next.actionSelect;
      const sel = cmd.subCommands.find((c) => c.name === select)!;
      return this.checkForSubCmd(sel, args);
    }
    return this.runCmd(cmd, args);
  }

  async run(): Promise<boolean> {
    const cmdList = this.handler.getCmds(true);
    const cmd = await inquirer.prompt({
      name: 'actionSelect',
      type: 'list',
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
    const select = cmd.actionSelect;
    const sel = cmdList.find((c) => c.name === select)!;

    const args = new InteractionArgs();
    return this.checkForSubCmd(sel, args);
  }
}
