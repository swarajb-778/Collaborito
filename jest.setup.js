// Define Jest globally to fix 'jest is not defined' errors
global.jest = {
  mock: (moduleName, factory) => jest.mock(moduleName, factory),
  fn: (implementation) => jest.fn(implementation)
};

// Mock modules that might cause issues in tests
jest.mock('expo-linking');
jest.mock('expo-router');

// Mock the global fetch function
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ok: true
  })
);
