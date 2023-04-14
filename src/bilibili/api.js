/* eslint-disable import/prefer-default-export */
import got from 'got';
import { makeGotOptions } from '../utils.js';

function getUser(credential) {
  return got
    .get(
      'https://api.bilibili.com/x/web-interface/nav',
      makeGotOptions(credential)
    )
    .json()
    .then(({ data }) => {
      if (!data.isLogin) {
        throw new Error(`Invalid credential: ${credential}`);
      }

      return {
        name: data.uname,
        isVip: !!data.vipStatus,
      };
    });
}

export default {
  getUser,
};
