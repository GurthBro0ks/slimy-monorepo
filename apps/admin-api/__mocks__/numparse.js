// Mock numparse module
module.exports = {
  parseNumber: jest.fn((value) => parseFloat(value) || 0),
  formatNumber: jest.fn((value) => String(value)),
};
