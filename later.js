(function() {

  function bindMethod(obj, name){
    var method = obj[name];
    obj[name] = function() {
      return method.apply(obj, arguments);
    };
  }

  function isFunction(x) {
    return typeof x === "function";
  }

  function isThenable(x) {
    return x && isFunction(x.then);
  }

  var emptyPromise = {
    resolve: function(){},
    reject: function(){}
  };

  function Branch(onFulfilled, onRejected) {
    bindMethod(this, 'then');
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
    this.promise = emptyPromise;
  }

  Branch.prototype.handle = function(methodName, arg) {
    var value = arg;
    if (isFunction(this[methodName])) {
      try {
        value = this[methodName](arg);
      } catch (reason) {
        this.promise.reject(reason);
      }
      this.promise.resolve(value);
      return true;
    }
  };

  Branch.prototype.fulfill = function(value) {
    if (!this.handle('onFulfilled', value)) {
      this.promise.resolve(value);
    }
  };

  Branch.prototype.reject = function(reason) {
    if (!this.handle('onRejected', reason)) {
      this.promise.reject(reason);
    }
  };

  Branch.prototype.then = function(onFulfilled, onRejected) {
    if (this.promise === emptyPromise) {
      this.promise = new Promise();
    }
    return this.promise.then(onFulfilled, onRejected);
  };



  function Promise() {
    for(var method in Promise.prototype) {
      bindMethod(this, method);
    }
    this.pendingBranches = [];
    this.state = 'pending';
  }

  Promise.prototype.resolve = function(x) {
    if (isThenable(x)) {
      x.then(this.resolve, this.reject);
    } else {
      this.fulfill(x);
    }
  };

  Promise.prototype.flushBranches = function() {
    var success = this.state === 'fulfilled';
    var method = success ? 'fulfill' : 'reject';
    var arg = success ? this.value : this.reason;
    var branches = this.pendingBranches;
    setTimeout(function() {
      while(branches.length) {
        branches.shift()[method](arg);
      }
    });
  };

  Promise.prototype.fulfill = function(value) {
    if (this.state === 'pending') {
      this.value = value;
      this.state = 'fulfilled';
      this.flushBranches();
    }
  };

  Promise.prototype.reject = function(reason) {
    if (this.state === 'pending') {
      this.reason = reason;
      this.state = 'rejected';
      this.flushBranches();
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var branch = new Branch(onFulfilled, onRejected);
    this.pendingBranches.push(branch);
    if(this.state !== 'pending') {
      this.flushBranches();
    }
    return { then: branch.then };
  };

  function iou(fn) {
    var promise;
    promise = new Promise();
    fn(promise.resolve, promise.reject);
    return { then: promise.then };
  };

  iou.Promise = Promise;

  iou(function(res) {
    res(3);
  }).then(function(val) {
    console.log('val', val);
  });


  function all(promises) {

    return iou(function(resolve, reject) {

      var pendingCount = promises.length;
      var values = [];
      var rejected = false;

      function checkDone() {
        if(pendingCount === 0) {
          resolve(values);
        }
      }

      function onRejected(reason) {
        if(!rejected) {
          reject(reason);
          rejected = true;
        }
      }

      function onFulfilled(i) {
        return function(value) {
          if (!rejected) {
            values[i] = value;
            --pendingCount;
            checkDone();
          }
        }
      }

      for(var i = 0; i < promises.length; i++) {
        promises[i].then(onFulfilled(i), rej);
      }

      checkDone();
    });
  };

  var adapter = {
    fulfilled: function(value) {
      return iou(function(resolve) {
        return resolve(value);
      });
    },
    rejected: function(error) {
      return iou(function(resolve, reject) {
        return reject(error);
      });
    },
    pending: function() {
      var pending;
      pending = {};
      pending.promise = iou(function(resolve, reject) {
        pending.fulfill = resolve;
        return pending.reject = reject;
      });
      return pending;
    }
  };

  module.exports = global.adapter = adapter;

}).call(this);
