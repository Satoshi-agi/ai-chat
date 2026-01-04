import '@testing-library/jest-dom';

// Mock scrollIntoView for jsdom
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = function() {};
}

// Polyfill fetch for Node.js < 18 or when not available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: new Headers(),
    })
  ) as jest.Mock;
}
