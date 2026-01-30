export default {
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>", "<rootDir>/../test"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  moduleDirectories: ["node_modules", "<rootDir>/node_modules", "<rootDir>/../node_modules"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.test.json",
        diagnostics: false
      }
    ]
  },
  setupFiles: ["<rootDir>/../test/setupEnv.ts"],
  setupFilesAfterEnv: ["<rootDir>/../test/setup.ts"],
  testMatch: ["**/*.test.ts"]
};
