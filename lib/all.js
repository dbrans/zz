
function all(promises) {

  return Promise.me(function(resolve, reject) {

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


