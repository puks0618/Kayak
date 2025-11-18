/**
 * Kafka Configuration
 */

module.exports = {
  clientId: 'user-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  groupId: 'user-service-group',
  topics: {
    userCreated: 'user.created',
    userUpdated: 'user.updated',
    userDeleted: 'user.deleted'
  }
};

