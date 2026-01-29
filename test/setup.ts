/// <reference types="jest" />
import { prisma } from "../backend/src/database/client.js";
import { cleanDatabase, seedPriceData } from "./utils/db.js";

beforeEach(async () => {
  await cleanDatabase();
  await seedPriceData();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
