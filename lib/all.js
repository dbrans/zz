var promise = require('./promise');

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
      promises[i].then(onFulfilled(i), rej);
    }

    checkDone();
  });
};


