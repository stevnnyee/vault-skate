// jest.setup.js

// Set default timeout for all tests
jest.setTimeout(30000);

// Handle async operation warnings
beforeEach(() => {
  jest.useRealTimers();
});

// Clean up after tests
afterEach(() => {
  jest.useRealTimers();
});