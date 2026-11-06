// eslint-disable-next-line no-undef
module.exports = {
  testEnvironment: "node", // Mặc định Jest chạy trong môi trường Node.js
  roots: ["<rootDir>/tests"],
  moduleNameMapper: { "^~/(.*)$": "<rootDir>/src/$1" }, // ánh xạ alias khi import module. Cannot find module '~/...' khi chạy test. $1 ý nghĩa là phần còn lại sau './src/...'
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"], // Khai báo file jest.setup.js sẽ chạy sau khi Jest khởi tạo môi trường test ENV.
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/**/server.js"], // Tính coverage cho toàn bộ - Loại trừ các file index thuần export không có logic gì.
  coverageDirectory: "coverage",
};
