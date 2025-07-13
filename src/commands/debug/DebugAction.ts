import { XUtil } from '@grandlinex/core';
import {
  ShellCommand,
  ShellCommandParentProps,
} from '../../class/ShellComand.js';
import { IArgs } from '../../lib/types.js';
import ArgUtil from '../../utils/ArgUtil.js';
import ProgressBar from '../../class/ProgressBar.js';

export default class DebugAction extends ShellCommand {
  constructor(props: ShellCommandParentProps) {
    super({
      ...props,
      name: 'debug',
      description: 'Debug the CLI',
      properties: [
        {
          key: 'null-field',
          type: 'null',
          required: false,
        },
        {
          key: 'string-field',
          type: 'string',
          required: false,
        },
        {
          key: 'string-default',
          type: 'string',
          required: false,
          default: '1234994',
        },
        {
          key: 'string-default-function',
          type: 'string',
          required: false,
          default: async () => new Date().toISOString(),
          prefill: 'editable',
          editor: true,
        },
        {
          key: 'number-field',
          type: 'number',
          required: false,
        },
        {
          key: 'path-field',
          type: 'path',
          required: false,
          dirOnly: true,
        },
        {
          key: 'progress',
          type: 'null',
          required: false,
        },
      ],
    });
  }

  async run(parser: IArgs): Promise<boolean> {
    const progress = parser.getParameterNull('progress');
    ArgUtil.printDebug(this, parser);
    if (progress) {
      const bar = new ProgressBar(10);
      let count = 0;
      while (count !== 10) {
        bar.setState(count, ` ${count}/10`);
        count++;
        await XUtil.sleep(1000);
      }
    }

    return true;
  }
}
