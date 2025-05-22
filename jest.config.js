
/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  workerIdleMemoryLimit: 0.2,
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
};
