export default class EventEmitter {
  map = {};

  on(type, handle) {
    let handlers = this.map[type];
    if (!handlers) {
      handlers = [];
      this.map[type] = handlers;
    }
    handlers.push(handle);
    return () => this.off(type, handle);
  }

  off(type, handle) {
    const handlers = this.map[type];
    if (handlers) {
      const i = handlers.indexOf(handle);
      if (i >= 0) handlers.splice(i, 1);
    }
  }

  once(type, handle) {
    const revoke = this.on(type, handleOnce);
    return revoke;
    function handleOnce(...args) {
      handle(...args);
      revoke();
    }
  }

  emit(type, ...args) {
    const handlers = this.map[type];
    if (handlers) {
      handlers.forEach(handle => {
        handle(...args);
      });
    }
  }
}
