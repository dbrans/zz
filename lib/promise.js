// Bind an objects method to the object
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

  this.on = { fulfilled: onFulfilled, rejected: onRejected };
  this.promise = new Promise();
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

function Promise(rvalue) {
  bindMethod(this, 'resolve');
  bindMethod(this, 'reject');
  bindMethod(this, 'then');

  this.pendingBranches = [];
  this.state = 'pending';

  arguments.length && this.resolve(rvalue);
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

Promise.prototype.resolve = function(rvalue) {
  if (isThenable(rvalue)) {
    rvalue.then(this.resolve, this.reject);
  } else {
    this.transition('fulfilled', rvalue);
  }
};

Promise.prototype.reject = function(reason) {
  this.transition('rejected', reason);
  throw reason;
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  var branch = new Branch(onFulfilled, onRejected);
  this.pendingBranches.push(branch);
  if(this.state !== 'pending') {
    this.scheduleBranchTransitions();
  }
  return {then: branch.promise.then};
};

module.exports = function(fn) {
  return new Promise({ then: fn });
};

module.exports.Promise = Promise;
module.exports.isFunction = isFunction;
module.exports.isThenable = isThenable;