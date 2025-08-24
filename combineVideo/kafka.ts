import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"]
})

export const kafkaConsumer = kafka.consumer({
    groupId: "test-1"
})
