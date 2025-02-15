import { Restaurant } from '@api-interfaces';
import { DEFAULT_ORGANIZATION } from '@server/test/mocks/organizations';
import { uuidv7 } from 'uuidv7';

/** The system should initialize with a default restaurant */
export const DEFAULT_RESTAURANT: Omit<Restaurant, 'menuIDs'> = {
  id: uuidv7(),
  name: 'Byte & Sabor',
  description:
    'Nossa decoração apresenta telas de terminal nas mesas, murais de código e garçons vestidos como programadores. Explore nosso "Menu de Linhas de Comando" com pratos como "Macarrão de Markdown", "Bife à Moda de Python" e "Sobremesa de HTML".',
  createdAt: new Date(),

  organizationID: DEFAULT_ORGANIZATION.id,

  address: 'Rua dos Algoritmos, 4040, Bairro da Codificação, Cidade do Byte',
  phone: '(11) 9876-5432',
  isClosed: false,
  tables: [
    {
      id: uuidv7(),
      name: '1',
    },
    {
      id: uuidv7(),
      name: '2',
    },
    {
      id: uuidv7(),
      name: '3',
    },
    {
      id: uuidv7(),
      name: '4',
    },
  ],
  theme: null,
  facebook: null,
  instagram: null,
  whatsapp: null,
  website: null,
  email: null,
  serviceFeeInPercentage: null,
};
