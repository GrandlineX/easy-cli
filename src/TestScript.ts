import CommandHandler from './CommandHandler.js';
import DebugAction from './commands/debug/DebugAction.js';

export default class TestScript extends CommandHandler {
  constructor() {
    super({
      isDev: true,
      cmdName: 'test-script',
      defaultInteractive: true,
      pageSize: 8,
    });
    this.addCmd((props) => [new DebugAction(props)]);
  }
}
