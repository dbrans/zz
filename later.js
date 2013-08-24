

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
        } catch(e) {
          return subpromises.forEach(function(p) {
            p.reject && p.reject(e);
          });
        }
        subpromises.forEach(function(p) {
          p.resolve && p.resolve(val);
        });
      });
    }
  };
  var reject = function(val) {
    if (promise.state === 'pending') {
      promise.value = val;
      promise.state = 'rejected';
      setTimeout(function() {
        try {
          rejects.forEach(function(f) {
            f(val);
          });
        } catch(e) {
          return subpromises.forEach(function(p) {
            p.reject && p.reject(e);
          });
        }
        subpromises.forEach(function(p) {
          p.resolve && p.resolve(val);
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
      var subpromise = {
        then: function(resolve, reject) {
          this.resolve = resolve;
          this.reject = reject;
        }
      };

      subpromises.push(subpromise);
      return subpromise;
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