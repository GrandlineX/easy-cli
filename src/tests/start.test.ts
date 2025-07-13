import { DefaultLogger, LogLevel } from '@grandlinex/core';
import CliParser from '../class/CliParser.js';
import ArgUtil from '../utils/ArgUtil.js';

const logger = new DefaultLogger();
logger.setLogLevel(LogLevel.VERBOSE);
describe('Parser', () => {
  test.each([
    ['Basic cmd', ['--interactive'], true],
    ['Basic cmd invalid wrong order', ['--someparam=any', 'args'], false],
    [
      'Basic cmd invalid duplicated',
      ['--someparam=any', '--someparam=other'],
      false,
    ],
    [
      'Full param list',
      [
        'first second',
        '--boolT=true',
        '--boolF=false',
        '--num1=1',
        '--num2=1.1',
        '--without',
      ],
      true,
    ],
    [
      'Long URL',
      [
        'download',
        '--url=https://www.demo.tv/videos/12345?filter=archives&sort=time',
      ],
      true,
    ],
    [
      'Long bad URL ',
      [
        'download',
        '--url',
        'https://www.demo.tv/videos/12345?filter=archives&sort=time',
      ],
      false,
    ],
    ['Some Wrapped Text', ['texttest', "--title='1234 abcs'"], true],
  ])(`%s`, (name, args, valid) => {
    expect(name).toBe(name);
    try {
      const parser = new CliParser(logger, args);
      ArgUtil.printDebug(parser, parser);
    } catch (e) {
      expect(valid).toBeFalsy();
    }
  });
});
