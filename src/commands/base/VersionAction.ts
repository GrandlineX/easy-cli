import {
  ShellCommand,
  ShellCommandParentProps,
} from '../../class/ShellComand.js';
import getVersion from '../../utils/Version.js';
import { IArgs } from '../../lib/types.js';

export default class VersionAction extends ShellCommand {
  constructor(props: ShellCommandParentProps) {
    super({
      ...props,
      name: 'version',
      description: 'Print the tool version',
      properties: [
        {
          key: 'version',
          type: 'null',
          required: true,
        },
        {
          key: 'stdout',
          type: 'null',
          required: false,
          description: 'Print version to stdout instead of logger',
        },
      ],
    });
  }

  async run(parser: IArgs): Promise<boolean> {
    const param = parser.getParameters();
    if (param.has('stdout')) {
      console.log(`v${getVersion()}`);
    } else {
      this.log(`v${getVersion()}`);
    }
    return true;
  }
}
