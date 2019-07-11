'use strict';

const Autolinker = require('autolinker');
const api = require('./common/api');
const twitterToken = require('./common/twitter-token');

module.exports = async (activity) => {
  try {
    // manually retrieve token if v1
    if (!activity.Context.connector.token) activity.Context.connector.token = await twitterToken(activity);

    // if still no token, return
    if (!activity.Context.connector.token) {
      activity.Response.ErrorCode = 403;
      activity.Response.Data = {
        ErrorText: 'Access token not granted'
      };

      return;
    }

    api.initialize(activity);

    const accounts = `from%3A${activity.Context.connector.custom2.replace(/,/g, '+OR+from%3A')}`;
    const hashtags = `%23${activity.Context.connector.custom3.replace(/,/g, '+OR+%23')}`;

    const pages = $.pagination(activity);

    let endpoint = `/search/tweets.json?q=${accounts}+OR+${hashtags}&tweet_mode=extended&count=100`;

    if (pages.nextpage) endpoint += `&max_id=${pages.nextpage}`;

    const response = await api(endpoint);

    const data = response.body;
    const map = new Map();

    activity.Response.Data.items = [];

    let count = 0;
    let index = 0;
    let lastItem = null;

    while (count < pages.pageSize && index < data.statuses.length) {
      // if its a nextpage request, we skip first item, as it was at the end of previous response
      if (pages.nextpage !== '' && index === 0) {
        index++;
        continue;
      }

      if (pages.pageSize - count === data.statuses.length - count) {
        activity.Response.Data.items.push(convertItem(data.statuses[index]));
        count++;
      } else if (!map.has(data.statuses[index].id_str) && !map.has(data.statuses[index].full_text)) {
        activity.Response.Data.items.push(convertItem(data.statuses[index]));

        map.set(data.statuses[index].id_str, true);
        map.set(data.statuses[index].full_text, true);

        count++;
      }

      lastItem = data.statuses[index];

      index++;
    }

    if (lastItem && lastItem.id_str) activity.Response.Data._nextpage = lastItem.id_str;
  } catch (error) {
    $.handleError(error, activity);
  }
};

function convertItem(raw) {
  const item = {
    user: {
      id: raw.user.id_str,
      screenName: raw.user.screen_name,
      name: raw.user.name,
      avatar: raw.user.profile_image_url_https
    },
    id: raw.id_str,
    favourites: raw.favorite_count,
    retweets: raw.retweet_count,
    date: new Date(raw.created_at).toISOString(),
    link: 'https://twitter.com/statuses/' + raw.id_str
  };

  if (raw.full_text.lastIndexOf(' https://t.co/') !== -1 && raw.full_text.charAt(raw.full_text.length - 1) !== '…') {
    item.text = raw.full_text.substring(0, raw.full_text.lastIndexOf(' https://t.co/'));
  } else {
    item.text = raw.full_text;
  }

  item.text = Autolinker.link(item.text, {
    hashtag: 'twitter',
    mention: 'twitter'
  });

  if (raw.extended_entities && raw.extended_entities.media) {
    item.thumbnail = raw.extended_entities.media[0].media_url_https;
  }

  if (raw.entities.symbols && raw.entities.symbols.length > 0) {
    const regex = /\$[A-Za-z]{1,6}([._][A-Za-z]{1,2})?/g;
    const matches = raw.full_text.match(regex);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        const enc = matches[i].replace('$', '%24');
        const a = `<a href="https://twitter.com/search?q=${enc}" target="_blank" rel="noopener noreferrer">${matches[i]}</a>`;

        item.text = item.text.replace(matches[i], a);
      }
    }
  }

  item.text = item.text.replace(/<a href/g, '<a class="blue" at-click-action="select" href');

  return item;
}
