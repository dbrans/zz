var promise = require('./promise');

function when(value) {
  return promise.isThenable(value) ?
          value :
          new promise.Promise(value);
}
exports.when = when;

function all(promises) {

  return promise(function(resolve, reject) {

    var pendingCount = promises.length;
    var values = [];

    function checkDone() {
      if(pendingCount === 0) {
        resolve(values);
      }
    }

    function onFulfilled(i) {
      return function(value) {
        values[i] = value;
        --pendingCount;
        checkDone();
      }
    }

    for(var i = 0; i < promises.length; i++) {
      when(promises[i]).then(onFulfilled(i), reject);
    }

    checkDone();
  });
}

exports.all = all;


// Wrap functions that accept callbacks of the form function(err, value){}
exports.wrapAsync = function wrapAsync(fn) {
  return function wrappedAsync() {
    var args = Array.prototype.slice.call(arguments);
    var _this = this;

    return promise(function (resolve) {
      args.push(function callback() {
        resolve.apply(null, arguments);
      });
      fn.apply(_this, args);
    });

  };
};

// Wrap functions that accept callbacks that only take a value
exports.wrapAsyncSimple = function wrapAsyncSimple(fn) {
  return function wrappedAsyncSimple() {
    var args = Array.prototype.slice.call(arguments);
    var _this = this;

    return promise(function (resolve) {
      args.push(function callback() {
        resolve.apply(null, arguments);
      });
      fn.apply(_this, args);
    });

  };
};



