import { mqttBroker, aedes } from './lib/aedes'
import { onMQTTPacketPublish } from './lib/aedes/listeners/MQTTPacketPublish'
import { elysiaApp } from './lib/elysia'

mqttBroker.listen(process.env.MQTT_BROKER_PORT, function () {
	console.log('MQTT Broker listening at: ', process.env.MQTT_BROKER_PORT)
})

aedes.on('publish', onMQTTPacketPublish)

elysiaApp.listen(Number(process.env.ELYISA_PORT), () => {
	console.log(`Elysia server listening at: ${process.env.ELYISA_PORT}`)
})