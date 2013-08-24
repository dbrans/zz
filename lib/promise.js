function bindMethod(obj, name){
  var method = obj[name];
  obj[name] = function() { return method.apply(obj, arguments); };
}

function isFunction(x) {
  return Object.prototype.toString.call(x) === '[object Function]';
}

function isThenable(x) {
  return x && isFunction(x.then);
}

var emptyPromise = { resolve: function(){}, reject: function(){} };

function Branch(onFulfilled, onRejected) {
  bindMethod(this, 'then');
  this.on = { fulfilled: onFulfilled, rejected: onRejected };
  this.promise = emptyPromise;
}

Branch.prototype.transition = function(state, valueOrReason) {
  if (isFunction(this.on[state])) {
    try {
      var value2 = this.on[state](valueOrReason);
    } catch (reason) {
      this.promise.reject(reason);
    }
    this.promise.resolve(value2);
  } else {
    // Pass through
    var method = state === 'fulfilled' ? 'resolve' : 'reject';
    this.promise[method](valueOrReason);
  }
};

Branch.prototype.then = function(onFulfilled, onRejected) {
  if (this.promise === emptyPromise) {
    this.promise = new Promise();
  }
  return this.promise.then(onFulfilled, onRejected);
};

function Promise(value) {
  for(var method in Promise.prototype) {
    bindMethod(this, method);
  }
  this.pendingBranches = [];
  this.state = 'pending';

  arguments.length && this.resolve(value);
}

Promise.prototype.flushBranches = function() {
  var success = this.state === 'fulfilled';
  var method = success ? 'fulfill' : 'reject';
  var arg = success ? this.value : this.reason;
  var branches = this.pendingBranches;
  setTimeout(function() {
    while(branches.length) {
      branches.shift().transition(this.state, arg);
    }
  });
};

Promise.prototype.resolve = function(value) {
  if (this.state === 'pending') {
    if (isThenable(value)) {
      value.then(this.resolve, this.reject);
    } else {
      this.value = value;
      this.state = 'fulfilled';
      this.flushBranches();
    }
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
  return {then: branch.then};
};

module.exports = function(fn) {
  return { then: new Promise({ then: fn }).then }
};

module.exports.Promise = Promise;
