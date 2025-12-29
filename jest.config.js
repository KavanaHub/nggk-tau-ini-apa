export default {
    testEnvironment: 'node',
    transform: {},
    moduleFileExtensions: ['js', 'mjs'],
    testMatch: ['**/__tests__/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        '!**/node_modules/**',
        '!coverage/**'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    verbose: true,
    testTimeout: 30000,
    setupFilesAfterEnv: ['./__tests__/setup.js']
};
