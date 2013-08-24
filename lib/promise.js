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

function Branch(onFulfilled, onRejected) {
  bindMethod(this, 'then');
  this.onFulfilled = onFulfilled;
  this.onRejected = onRejected;
  this.promise = new Promise();
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

function Promise(value) {
  for(var method in Promise.prototype) {
    bindMethod(this, method);
  }
  this.pendingBranches = [];
  this.state = 'pending';

  arguments.length && this.resolve(value);
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
  return {then: branch.promise.then};
};

module.exports = function(fn) {
  return { then: new Promise({then: fn}).then }
};

module.exports.Promise = Promise;
