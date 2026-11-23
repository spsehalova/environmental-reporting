import { createServer } from 'node:net'
import { Aedes } from 'aedes'
import { aedesAuthentificate } from './handlers/authentificate'

export const aedes = await Aedes.createBroker({
	authenticate: aedesAuthentificate
})
export const mqttBroker = createServer(aedes.handle)