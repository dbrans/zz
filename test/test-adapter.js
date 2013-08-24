var promise = require('../lib/promise');

var adapter = {
  fulfilled: function(value) {
    return new promise.Promise(value);
  },
  rejected: function(error) {
    return promise(function(resolve, reject) {
      return reject(error);
    });
  },
  pending: function() {
    var pending;
    pending = {};
    pending.promise = promise(function(resolve, reject) {
      pending.fulfill = resolve;
      return pending.reject = reject;
    });
    return pending;
  }
};

module.exports = global.adapter = adapter;