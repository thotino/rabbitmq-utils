/**
 * project JSDoc description
 * @module {Object} module name
 * @version 1.0.0
 * @author author name
 * @requires dependency 1
 * @requires dependency 2
 * ...
 */

"use strict";

//================================================================================
// dependencies
//================================================================================
const Promise = require("bluebird");
const amqplib = require("amqplib");

//================================================================================
// config
//================================================================================
/** import here configurations */

//================================================================================
// aliases
//================================================================================
/** declare here local variables aliasing some of often used imports / conf options */

//================================================================================
// module
//================================================================================
const connect = function connect(url = "amqp://localhost") {
  return amqplib.connect(url).then((conn) => { return conn.createChannel(); })
    .then((channel) => { return channel; });
};

const publishQueue = exports.publishQueue = function publishQueue(queue, message) {
  return connect().then((channel) => {
    return channel.assertQueue(queue)
      .then((replies) => {
        return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      });
  }).catch(console.warn);
};

const consumeQueue = exports.consumeQueue = function consumeQueue(queue) {
  return connect().then((channel) => {
    return channel.assertQueue(queue)
      .then((replies) => {
        return channel.consume(queue, (msg) => {
          if (msg !== null) {
            console.log(msg.content.toString());
            channel.ack(msg);
          }
        });
      });
  }).catch(console.warn);
};
