/** Canonical validated havnepakker, shared by client, solo and server. */
import { content } from '../content';
export const destinations = content.ports.map(pack => pack.port);
export const getDestinationById = (id: string) => destinations.find(d => d.id === id);
export const getAllDestinations = () => destinations;
export const getRandomDestination = () => destinations[Math.floor(Math.random() * destinations.length)];
