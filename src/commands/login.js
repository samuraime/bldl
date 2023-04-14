import settings from '../settings.js';

export default {
  command: 'login <credential>',
  description: 'Login to download higher quality streams',
  builder: (yargs) => {
    yargs.positional('credential', {
      type: 'string',
      describe: 'Bilibili SESSDATA from browser Cookies',
    });
  },
  handler: (argv) =>
    settings
      .setCredential(argv.credential)
      .then((user) => {
        const type = user.isVip ? 'VIP user' : 'user';

        // eslint-disable-next-line no-console
        console.log(`Logged in as ${type}: ${user.name}`);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error.message);
        process.exit(1);
      }),
};
