import CommandHandler from './CommandHandler.js';

export default class TestScript extends CommandHandler {
  constructor() {
    super({
      isDev: false,
      cmdName: 'test-script',
      defaultInteractive: true,
      pageSize: 8,
    });
  }
}
