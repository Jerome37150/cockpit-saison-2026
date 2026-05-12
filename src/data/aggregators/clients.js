// =============================================================================
// CLIENTS — liste des campings clients.
//
// Source : Inaxel (`inaxel/clients.json`) — export backoffice / CRM commercial,
// déposé par l'agent IA.
// =============================================================================

import clients from '../sources/inaxel/clients.json';
import { clientsSchema, validate } from '../shared/schemas.js';

const data = validate(clientsSchema, clients, 'inaxel/clients.json');

export const CLIENTS = data.rows;
