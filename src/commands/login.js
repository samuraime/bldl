import settings from '../settings.js';

export default {
  command: 'set-credential <credential>',
  description: 'Store credential for downloading streams',
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
        // eslint-disable-next-line no-console
        console.log(
          `Stored credential for user: ${user.name}, VIP: ${
            user.isVip ? 'yes' : 'no'
          }`
        );
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error.message);
        process.exit(1);
      }),
};
