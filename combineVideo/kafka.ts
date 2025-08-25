import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"]
})

export const kafkaConsumer = kafka.consumer({
    groupId: "test-1",
    sessionTimeout: 90000,
    heartbeatInterval: 3000,
})
