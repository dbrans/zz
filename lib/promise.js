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
      var value = this.on[state](valueOrReason);
    } catch (reason) {
      this.promise.reject(reason);
    }
    this.promise.resolve(value);
  } else {
    // Pass through
    this.promise.transition(state, valueOrReason);
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

Promise.prototype.scheduleBranchTransitions = function() {
  var branches = this.pendingBranches;
  var state = this.state;
  var valueOrReason = this.valueOrReason;

  setTimeout(function() {
    while(branches.length) {
      branches.shift().transition(state, valueOrReason);
    }
  });
};

Promise.prototype.transition = function(state, valueOrReason) {
  if(this.state === 'pending') {
    this.state = state;
    this.valueOrReason = valueOrReason;
    this.scheduleBranchTransitions();
  }
};

Promise.prototype.resolve = function(value) {
  if (isThenable(value)) {
    value.then(this.resolve, this.reject);
  } else {
    this.transition('fulfilled', value);
  }
};

Promise.prototype.reject = function(reason) {
  this.transition('rejected', reason);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  var branch = new Branch(onFulfilled, onRejected);
  this.pendingBranches.push(branch);
  if(this.state !== 'pending') {
    this.scheduleBranchTransitions();
  }
  return {then: branch.then};
};

module.exports = function(fn) {
  return { then: new Promise({ then: fn }).then }
};

module.exports.Promise = Promise;
