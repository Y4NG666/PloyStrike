process.env.NODE_ENV = "test";
process.env.REDIS_URL = "";

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
