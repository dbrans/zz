

var Later = function(f) {

  var resolves = [];
  var rejects = [];

  var resolve = function(val) {
    if (promise.state === 'pending') {
      promise.value = val;
      promise.state = 'resolved';
      setTimeout(function() {
        try {
          resolves.forEach(function(f) {
            f(val);
          });
        } catch(e) {}
      });
    }
  };
  var reject = function(val) {
    if (promise.state === 'pending') {
      promise.value = val;
      promise.state = 'rejected';
      setTimeout(function() {
        rejects.forEach(function(f) {
          f(val);
        });
      });
    }
  };

  var subpromises = [];

  var promise = {
    then: function(resolve, reject) {
      if (typeof(resolve) == 'function') {
        resolves.push(resolve);
      }
      if (typeof(reject) == 'function') {
        rejects.push(reject);
      }
      return Later(function(resolve, reject) {

      });
    },
    state: 'pending',
    value: undefined
  };

  f(resolve, reject);

  return promise;
};


var adapter = {};

adapter.fulfilled = function(value) {
  return Later(function(resolve, reject) {
    resolve(value);
  });
};

adapter.rejected = function(error) {
  return Later(function(resolve, reject) {
    reject(error);
  });
};

adapter.pending = function () {
  var pending = {};

  pending.promise = Later(function(resolve, reject) {
    pending.fulfill = resolve;
    pending.reject = reject;
  });

  return pending;
};

module.exports = global.adapter = adapter;