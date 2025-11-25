const { Kafka } = require('kafkajs');

const clientId = process.env.KAFKA_CLIENT_ID || 'kayak-service';
const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({
    clientId,
    brokers
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'kayak-group' });

let isProducerConnected = false;
let isConsumerConnected = false;

const KafkaClient = {
    async connectProducer() {
        if (!isProducerConnected) {
            await producer.connect();
            isProducerConnected = true;
            console.log('Kafka Producer connected');
        }
    },

    async connectConsumer() {
        if (!isConsumerConnected) {
            await consumer.connect();
            isConsumerConnected = true;
            console.log('Kafka Consumer connected');
        }
    },

    async publish(topic, message) {
        if (!isProducerConnected) {
            await this.connectProducer();
        }
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message) }
            ],
        });
        console.log(`Message sent to topic ${topic}`);
    },

    async subscribe(topic, callback) {
        if (!isConsumerConnected) {
            await this.connectConsumer();
        }
        await consumer.subscribe({ topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = message.value.toString();
                console.log(`Received message on ${topic}: ${value}`);
                try {
                    await callback(JSON.parse(value));
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            },
        });
    }
};

module.exports = KafkaClient;
