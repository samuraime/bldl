import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import api from './bilibili/api.js';

const keys = {
  credential: 'credential',
};

function getSettingsPath() {
  return path.resolve(os.homedir(), '.bldlrc.json');
}

function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'));
  } catch {
    return {};
  }
}

function setItem(key, value) {
  const settings = {
    ...getSettings(),
    [key]: value,
  };

  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

function getItem(key) {
  return getSettings()[key];
}

export default {
  async setCredential(credential) {
    const user = await api.getUser(credential);

    setItem(keys.credential, credential);

    return user;
  },
  getCredential() {
    return getItem(keys.credential);
  },
};
