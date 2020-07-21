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

const deleteQueue = exports.deleteQueue = function deleteQueue(queue) {
  return connect().then((channel) => {
    return channel.checkQueue(queue).then((replies) => {
      return channel.deleteQueue(queue);
    });
  }).catch(console.warn);
};

const publishQueue = exports.publishQueue = function publishQueue(queue, message, options) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, {durable: false})
      .then((replies) => {
        if(!options) {
          return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        } else {
          return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), options);
        }
        
      });
  }).catch(console.warn);
};

const consumeQueue = exports.consumeQueue = function consumeQueue(queue) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, { durable: false })
      .then((replies) => {
        return channel.consume(queue, (msg) => {
          if (msg !== null) {
            console.log(msg.content.toString());
            channel.ack(msg);
            return msg;
          }
        });
      });
  }).catch(console.warn);
};

const consumeQueueWith = exports.consumeQueueWith = function consumeQueueWith(queue, treatmentFunction) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, { durable: false })
      .then((replies) => {
        return channel.consume(queue, (msg) => {
          if (msg !== null && typeof treatmentFunction === "function") {
            console.log(msg.content.toString());
            const curObject = JSON.parse(msg.content.toString())
            channel.ack(msg);
            return treatmentFunction(curObject);
          }
        });
      });
  }).catch(console.warn);
};

const readQueue = exports.readQueue = function readQueue(queue) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, { durable: false })
      .then((replies) => {
        return channel.get(queue)
        .then((msg) => {
          if (msg !== null) {
            console.log(msg.content.toString());
            channel.ack(msg);
            return msg;
          } else { return null; }

        });
      });
  }).catch(console.warn);
};
