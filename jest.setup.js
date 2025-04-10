jest.mock('expo-linking'); jest.mock('expo-router'); global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));
