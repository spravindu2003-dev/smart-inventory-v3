const prisma = require('./prisma');

async function logAction({ userId, action, entity, entityId, description }) {
  return prisma.activityLog.create({
    data: { userId, action, entity, entityId, description },
  });
}

module.exports = { logAction };
