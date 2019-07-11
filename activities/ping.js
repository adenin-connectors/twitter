'use strict';

const api = require('./common/api');
const twitterToken = require('./common/twitter-token');

module.exports = async (activity) => {
  try {
    // manually retrieve token if v1
    if (!activity.Context.connector.token) activity.Context.connector.token = await twitterToken(activity);

    api.initialize(activity);

    const accounts = `from%3A${activity.Context.connector.custom2.replace(/,/g, '+OR+from%3A')}`;
    const hashtags = `%23${activity.Context.connector.custom3.replace(/,/g, '+OR+%23')}`;

    const response = await api(`/search/tweets.json?q=${accounts}+OR+${hashtags}`);

    activity.Response = {
      ErrorCode: response.statusCode === 200 ? 0 : response.statusCode,
      Data: {
        success: response.statusCode === 200
      }
    };
  } catch (error) {
    $.handleError(activity, error);
    activity.Response.Data.success = false;
  }
};
