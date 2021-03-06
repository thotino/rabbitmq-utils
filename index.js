/**
 * project JSDoc description
 * @module {Object} module name
 * @version 1.0.0
 * @author Thotino GOBIN-GANSOU
 * @requires bluebird
 * @requires amqplib
 */

"use strict";

//================================================================================
// dependencies
//================================================================================
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
const connect = function connect(url = process.env.TRANSPORTER) {
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
        if (!options) {
          return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        }
        return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), options);
      });
  }).catch(console.warn);
};

const consumeQueue = exports.consumeQueue = function consumeQueue(queue) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, {durable: false})
      .then((replies) => {
        return channel.prefetch(1).then(() => {
          return channel.consume(queue, (msg) => {
            if (msg !== null) {
              console.log(msg.content.toString());
              channel.ack(msg);
              return msg;
            }
          });
        });
      });
  }).catch(console.warn);
};

const consumeQueueWith = exports.consumeQueueWith = function consumeQueueWith(queue, treatmentFunction) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, {durable: false})
      .then((replies) => {
        return channel.prefetch(1).then(() => {
          return channel.consume(queue, (msg) => {
            if (msg !== null && typeof treatmentFunction === "function") {
              console.log(msg.content.toString());
              const curObject = JSON.parse(msg.content.toString());
              channel.ack(msg);
              return treatmentFunction(curObject);
            }
          });
        });
      });
  }).catch(console.warn);
};

const readQueue = exports.readQueue = function readQueue(queue) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, {durable: false})
      .then((replies) => {
        return channel.get(queue)
          .then((msg) => {
            if (msg !== null) {
              console.log(msg.content.toString());
              channel.ack(msg);
              return msg;
            } return null;
          });
      });
  }).catch(console.warn);
};

const consumeAndReplyWith = exports.consumeAndReplyWith = function consumeAndReplyWith(queue, treatmentFunction) {
  return connect().then((channel) => {
    return channel.assertQueue(queue, {durable: false})
      .then((replies) => {
        return channel.prefetch(1).then(() => {
          return channel.consume(queue, (msg) => {
            if (msg !== null && typeof treatmentFunction === "function") {
              const curObject = JSON.parse(msg.content.toString());
              const response = treatmentFunction(curObject);
              const replyQueue = msg.properties.replyTo;
              const correlationID = msg.properties.correlationId;
              channel.ack(msg);
              return publishQueue(replyQueue, response, {correlationId: correlationID});
            }
          });
        });
      });
  }).catch(console.warn);
};
