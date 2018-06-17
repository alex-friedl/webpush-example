const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const winston = require('winston');
const path = require('path');
const PushNotifications = require('node-pushnotifications');

const log = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const settings = {
  web: {
    vapidDetails: {
      subject: 'mailto@me.net',
      publicKey: '< URL Safe Base64 Encoded Public Key >',
      privateKey: '< URL Safe Base64 Encoded Private Key >'
    },
    gcmAPIKey:
      'AAAA9U3NkO8:APA91bE9XnPD1WQGYle0dbJs6KO6HmAq_73f_z2PHoPr3sbRovXbn9q-PyJAKYlxgNI88rBpTzNWCXRuxhX9FcwbDBhT4h0BAiJr4BiEx8uSkWHXM92q04Q6cydK-dHGSnR20bsgH0Lg'
    // TTL: 2419200
    // headers: { }
    // contentEncoding: '< Encoding type, e.g.: aesgcm or aes128gcm >'
  }
};
const CLIENT_PATH = '/client';
const push = new PushNotifications(settings);
const app = express(feathers());

app.use(express.json());
app.configure(express.rest());
app.use(express.errorHandler());
app.use(CLIENT_PATH, express.static(path.join(__dirname, '../client')));

app.hooks({
  before: {
    all: context => {
      log.info(
        `Request to path ${context.path} with method ${context.method} ${
          context.data ? 'and data ' + JSON.stringify(context.data) : ''
        }`
      );
    }
  },

  error: context => {
    log.error(
      `Error in ${context.path} calling ${context.method} method`,
      context.error
    );
  }
});

app.use('subscriptions', memory({}));
const subscriptionService = app.service('subscriptions');

app.use('push', {
  async find(data, params) {
    log.info('Sending push notifications to all known subscriptions');

    try {
      const subscriptions = await subscriptionService.find();
      const results = await push.send(subscriptions, 'Push is working! :)');
      log.info('Push results', results);
      return results;
    } catch (err) {
      log.error('Unexpected error while sending web push notifications', err);
    }
  }
});

const SERVER_PORT = 3030;

app.listen(SERVER_PORT, () => {
  log.info(
    `Server started successfully. Demo Client http://localhost:${SERVER_PORT}${CLIENT_PATH}`
  );
});
