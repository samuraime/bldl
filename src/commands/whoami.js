import settings from '../settings.js';
import api from '../bilibili/api.js';

export default {
  command: 'whoami',
  description: 'Display Bilibili username',
  handler: () =>
    api
      .getUser(settings.getCredential())
      .then((user) => {
        // eslint-disable-next-line no-console
        console.log(user.name);
      })
      .catch(() => {
        // eslint-disable-next-line no-console
        console.error('Error: Not logged in');
        process.exit(1);
      }),
};
