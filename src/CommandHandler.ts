import * as process from 'process';
import {
  CMap,
  CoreLogChannel,
  CoreLogger,
  DefaultLogger,
  LogLevel,
} from '@grandlinex/core';
import getVersion from './utils/Version.js';
import CliParser from './class/CliParser.js';
import { ShellCommand } from './class/ShellComand.js';
import { IArgs, IHandler } from './lib/types.js';
import HelpAction from './commands/base/HelpAction.js';
import VersionAction from './commands/base/VersionAction.js';
import InteractiveAction from './commands/base/InteractiveAction.js';
import ArgUtil from './utils/ArgUtil.js';
import InteractionArgs from './class/InteractionArgs.js';

export default abstract class CommandHandler<X = any>
  extends CoreLogChannel
  implements IHandler<X>
{
  private baseCmd: CMap<string, ShellCommand>;

  private cmdMap: CMap<string, ShellCommand>;

  readonly logger: CoreLogger;

  private readonly dev: boolean;

  private readonly pageSize?: number;

  private readonly defaultInteractive: boolean;

  private readonly cmdName: string;

  private readonly data: X | null;

  protected constructor(cnf?: {
    isDev?: boolean;
    defaultInteractive?: boolean;
    logger?: CoreLogger;
    cmdName?: string;
    pageSize?: number;
    data?: X | null;
  }) {
    super(cnf?.cmdName || 'easy-script', cnf?.logger || new DefaultLogger());
    this.data = cnf?.data || null;
    this.cmdName = cnf?.cmdName || 'easy-script';
    this.dev = cnf?.isDev || false;
    this.pageSize = cnf?.pageSize || 6;
    this.defaultInteractive = cnf?.defaultInteractive || false;
    const l = new DefaultLogger();
    l.setPrintTimestamp(false);
    if (this.dev) {
      l.setLogLevel(LogLevel.VERBOSE);
    }
    this.logger = l;
    this.cmdMap = new CMap();
    this.baseCmd = new CMap();
    const props = { logger: this.logger, handler: this };
    this.addBaseCmd(
      new HelpAction(props),
      new InteractiveAction(props),
      new VersionAction(props),
    );
  }

  getCmdName(): string {
    return this.cmdName;
  }

  protected addCmd(
    fc: (props: { logger: CoreLogger; handler: IHandler }) => ShellCommand[],
  ) {
    for (const c of fc({ logger: this.logger, handler: this })) {
      this.cmdMap.set(c.name, c);
    }
  }

  private addBaseCmd(...cmd: ShellCommand[]) {
    for (const c of cmd) {
      this.baseCmd.set(c.name, c);
    }
  }

  getCmds(full?: boolean): ShellCommand[] {
    if (full) {
      return [...this.baseCmd.toValueArray(), ...this.cmdMap.toValueArray()];
    }
    return this.cmdMap.toValueArray();
  }

  async run(iArgs?: InteractionArgs): Promise<void> {
    this.debug(`Startup: v${getVersion()}`);
    await this.onStart();
    try {
      const cmds = this.getCmds(true);
      const args: IArgs = iArgs || new CliParser(this.logger);
      ArgUtil.printDebug(this, args);
      const list = args.getCmdList();
      if (list.length > 0) {
        const cmd = cmds.find((c) => c.name === list[0]);
        if (cmd) {
          await cmd.start(args);
          return;
        }
      } else if (list.length === 0 && args.getLength() > 0) {
        const [option] = args.getParameters().toKeyArray();
        const dx = this.baseCmd.get(option);
        if (dx) {
          const result = await dx.start(args);
          if (result) {
            return;
          }
          throw this.lError(`Execution error`);
        }
      } else if (
        list.length === 0 &&
        args.getLength() === 0 &&
        this.defaultInteractive &&
        !iArgs
      ) {
        const dx = this.baseCmd.get('interactive');
        if (dx) {
          const arg = new InteractionArgs();
          arg.param.set('interactive', null);
          const result = await dx.start(arg);
          if (result) {
            return;
          }
          throw this.lError(`Execution error`);
        }
      }

      throw this.lError(`Unknown command ${list[0]}`);
    } catch (e) {
      this.error(
        'Exit with error! Run "easy-script --help" for more information',
      );
      process.exit(1);
    }
  }

  async onStart(): Promise<void> {
    this.verbose('CommandHandler started');
  }

  onEnd(): void {
    this.verbose('CommandHandler ended');
  }

  getData(): X | null {
    return this.data;
  }

  isDev(): boolean {
    return this.dev;
  }

  getPageSize(): number | undefined {
    return this.pageSize;
  }
}
