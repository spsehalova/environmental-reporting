import { createServer } from 'node:net'
import { Aedes } from 'aedes'

export const aedes = await Aedes.createBroker()
export const mqttBroker = createServer(aedes.handle)