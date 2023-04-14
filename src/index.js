#!/usr/bin/env node

import yargs from 'yargs';
import main from './commands/main.js';
import login from './commands/login.js';
import whoami from './commands/whoami.js';

// eslint-disable-next-line no-unused-expressions
yargs(process.argv.slice(2))
  .scriptName('bldl')
  .command(main)
  .command(login)
  .command(whoami).argv;
