// Generic mock for parent lib modules that don't exist
// This allows tests to run without creating all the missing lib files

module.exports = new Proxy({}, {
  get(target, prop) {
    // Return a jest mock function for any property access
    if (typeof target[prop] === 'undefined') {
      target[prop] = jest.fn(() => ({}));
    }
    return target[prop];
  }
});
