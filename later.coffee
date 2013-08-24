

isFunction = (x) -> typeof(x) is "function"
isPromise = (x) -> x.constructor is Promise

class Branch
  constructor: (@onFulfilled, @onRejected) ->
    @promise = new Promise()

  fulfill: (value) ->
    nextValue = value
    if isFunction @onFulfilled
      try
        nextValue = @onFulfilled value
      catch reason
        return @promise.reject reason


    @promise.resolve nextValue

  reject: (reason) ->
    nextValue = undefined
    if isFunction @onRejected
      try
        nextValue = @onRejected reason

      catch nextReason
        return @promise.reject nextReason

      @promise.resolve nextValue

    else
      @promise.reject reason

class Promise

  constructor: (impl) ->
    @branches = []
    @state = 'pending'
    impl?(@resolve, @reject)

  resolve: (val) =>
    @fulfill val

  fulfill: (value) =>
    if @state is 'pending'
      @value = value
      @state = 'fulfilled'
      setTimeout =>
        branch.fulfill value for branch in @branches

  reject: (reason) =>
    if @state is 'pending'
      @state = 'rejected'
      @reason = reason
      setTimeout =>
        branch.reject reason for branch in @branches

  then: (onFulfilled, onRejected) ->
    branch = new Branch onFulfilled, onRejected
    if @state is 'fulfilled'
      setTimeout => branch.fulfill @value
    else if @state is 'rejected'
      setTimeout => branch.reject @reason
    else
      @branches.push branch
    branch.promise




p = new Promise (resolve, reject) ->
  setTimeout -> resolve 3

p.then((val) ->
  console.log 'val', val
  throw 4
).then(null, (val) ->
  console.log 'val2', val
  5
)

adapter = {}
adapter.fulfilled = (value) ->
  new Promise (resolve, reject) ->
    resolve value


adapter.rejected = (error) ->
  new Promise (resolve, reject) ->
    reject error


adapter.pending = ->
  pending = {}
  pending.promise = new Promise (resolve, reject) ->
    pending.fulfill = resolve
    pending.reject = reject

  pending

module.exports = global.adapter = adapter