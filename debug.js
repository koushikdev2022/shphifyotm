const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  console.log('Loading:', id);
  try {
    return originalRequire.apply(this, arguments);
  } catch (error) {
    console.error('❌ ERROR loading:', id);
    console.error('Error details:', error.message);
    throw error;
  }
};

console.log('Starting application with require tracing...\n');
require('./dist/index.js');