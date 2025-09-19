module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  rootDir: '.',
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};