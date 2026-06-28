const prisma = require('./prisma');

async function logAction({ userId, businessId, action, entity, entityId, description }) {
  return prisma.activityLog.create({
    data: { userId, businessId, action, entity, entityId, description },
  });
}

module.exports = { logAction };
