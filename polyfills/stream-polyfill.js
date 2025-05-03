/**
 * Simple polyfill for Node.js stream module
 * This is a minimalistic implementation that provides just enough
 * to prevent the 'ws' package from crashing
 */

// Basic event emitter
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  }

  emit(event, ...args) {
    if (!this._events[event]) return false;
    this._events[event].forEach((listener) => listener(...args));
    return true;
  }

  removeListener(event, listener) {
    if (!this._events[event]) return this;
    this._events[event] = this._events[event].filter((l) => l !== listener);
    return this;
  }
}

// Base stream class
class Stream extends EventEmitter {
  pipe(dest) {
    return dest;
  }
}

// ReadableStream polyfill
class Readable extends Stream {
  constructor(options) {
    super();
    this._options = options || {};
  }

  read() {
    return null;
  }

  push() {
    return true;
  }
}

// WritableStream polyfill
class Writable extends Stream {
  constructor(options) {
    super();
    this._options = options || {};
  }

  write(chunk, encoding, callback) {
    if (callback) callback();
    return true;
  }

  end(chunk, encoding, callback) {
    if (callback) callback();
    this.emit('finish');
    return this;
  }
}

// Duplex stream (both readable and writable)
class Duplex extends Stream {
  constructor(options) {
    super();
    this._options = options || {};
  }

  read() {
    return null;
  }

  write(chunk, encoding, callback) {
    if (callback) callback();
    return true;
  }

  push() {
    return true;
  }

  end(chunk, encoding, callback) {
    if (callback) callback();
    this.emit('finish');
    return this;
  }
}

// Transform stream
class Transform extends Duplex {
  constructor(options) {
    super(options);
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
}

// Export stream classes
module.exports = {
  Stream,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough: Transform,
  pipeline: (source, ...streams) => {
    const last = streams[streams.length - 1];
    return last;
  },
  finished: (stream, callback) => {
    stream.on('finish', () => callback(null));
    stream.on('error', (err) => callback(err));
  }
}; 