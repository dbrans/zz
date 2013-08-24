

isFunction = (x) -> typeof(x) is "function"

isThenable = (x) -> isFunction x?.then

class Branch
  constructor: (@onFulfilled, @onRejected) ->

  fulfill: (value) ->
    nextValue = value
    if isFunction @onFulfilled
      try
        nextValue = @onFulfilled value
      catch reason
        return @promise?.reject reason

    @promise?.resolve nextValue

  reject: (reason) ->
    nextValue = undefined

    if isFunction @onRejected
      try
        nextValue = @onRejected reason
      catch nextReason
        return @promise?.reject nextReason

      @promise?.resolve nextValue

    else
      @promise?.reject reason

  then: =>
    @promise ?= new Promise()
    @promise.then.apply @promise, arguments

class Promise

  constructor: ->
    @branches = []
    @state = 'pending'

  resolve: (x) =>
    if isThenable x
      x.then @resolve, @reject
    else
      @fulfill x

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

  then: (onFulfilled, onRejected) =>
    branch = new Branch onFulfilled, onRejected
    if @state is 'fulfilled'
      setTimeout => branch.fulfill @value
    else if @state is 'rejected'
      setTimeout => branch.reject @reason
    else
      @branches.push branch
    then: branch.then

iou = (asyncFunction) ->
  promise = new Promise()
  asyncFunction(promise.resolve, promise.reject)
  then: promise.then

adapter =
  fulfilled: (value) ->
    iou (resolve) -> resolve value

  rejected: (error) ->
    iou (resolve, reject) -> reject error

  pending: ->
    pending = {}
    pending.promise = iou (resolve, reject) ->
      pending.fulfill = resolve
      pending.reject = reject
    pending

module.exports = global.adapter = adapter