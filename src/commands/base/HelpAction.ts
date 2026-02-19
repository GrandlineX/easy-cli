import {
  ShellCommand,
  ShellCommandParentProps,
} from '../../class/ShellComand.js';
import getVersion from '../../utils/Version.js';
import { StricktOption } from '../../lib/types.js';

export default class HelpAction extends ShellCommand {
  constructor(props: ShellCommandParentProps) {
    super({
      ...props,
      name: 'help',
      description: 'Print command list and help text',
      properties: [
        {
          key: 'help',
          type: 'null',
          required: true,
        },
      ],
    });
  }

  private space(n: number): string {
    return '  '.repeat(n);
  }

  private async inspectCmd(c: ShellCommand) {
    this.info(`${this.space(c.level + 1)}${c.name}: ${c.description}`);
    await Promise.all(
      c.properties.map(
        async ({ key, type, required, description, options }) => {
          let t;
          switch (type) {
            case 'string':
              if (!options) {
                t = `<${type}>`;
              } else {
                t = `<option>`;
              }
              break;
            case 'null':
              t = '';
              break;
            default:
              t = `<${type}>`;
          }
          this.info(
            `${this.space(c.level + 2)}--${key} ${t} ${
              required ? '(required)' : '(optional)'
            } ${description ? `: ${description}` : ''}`,
          );
          if (options) {
            this.info(`${this.space(c.level + 3)} Options:`);
            (await StricktOption(options, this.handler)).forEach((o) => {
              this.info(
                `${this.space(c.level + 4)}${o.key}${
                  o.description ? ` : ${o.description}` : ''
                }`,
              );
            });
          }
        },
      ),
    );
    await Promise.all(c.subCommands.map((cmd) => this.inspectCmd(cmd)));
    if (c.level === 0) this.info('---------------------------------');
  }

  async run(): Promise<boolean> {
    this.info(`Help for ${this.handler.getCmdName()} (v${getVersion()}):`);
    this.info('---------------------------------');
    this.info(
      `Usage: ${this.handler.getCmdName()} <command> [...<sub-command>]  [options]`,
    );
    this.info('---------------------------------');
    await Promise.all(
      this.handler.getCmds(true).map((c) => this.inspectCmd(c)),
    );
    return true;
  }
}
