/**
 * Shared database utilities and Prisma client
 * This package provides common database functions used across the monorepo
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  prisma,
  version: '1.0.0'
};
