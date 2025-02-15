import { MenuItem } from '@api-interfaces';
import { uuidv7 } from 'uuidv7';

export const MAIN_MENU_ITEMS: ReadonlyArray<MenuItem> = [
  /* Pizzas */
  {
    id: uuidv7(),
    name: 'Pizza do Byte de Pepperoni',
    description:
      'Uma explosão de sabor com pepperoni picante, molho de tomate enriquecido com Python e uma generosa camada de queijo CSS.',
    price: { value: 29.9, discount: null },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Pizza Java Supreme',
    description:
      'Esta pizza é tão robusta quanto a linguagem Java. Ela vem com molho de tomate JavaBeans, cogumelos multithreaded, pimentões JavaFX e queijo JDBC.',
    price: { value: 31.5, discount: 7 },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Pizza HTML Margherita',
    description:
      'Uma pizza clássica com um toque de desenvolvedor. O molho de tomate é como código HTML bem estruturado, com manjericão fresco, mozzarella e azeite de oliva em cascata.',
    price: { value: 37.45, discount: 2.14 },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Pizza de Linguagem de Programação Suprema',
    description:
      'Esta pizza é uma mistura suprema de linguagens de programação. Ela inclui pepperoni JavaScript, cogumelos Ruby, pimentões PHP e queijo Perl.',
    price: { value: 33, discount: 2.14 },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Pizza de API Apimentada',
    description:
      'Uma explosão de sabor com molho de tomate RESTful, frango API picante, pimentões JSON e queijo Swagger derretido.',
    price: { value: 39.99, discount: null },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Pizza de Linguagem Picante',
    description:
      'Uma pizza com uma pitada de pimenta. Apresenta molho de tomate Ruby on Rails, linguiça Python apimentada e jalapeños de alto desempenho.',
    price: { value: 35.5, discount: null },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Pizza Vegetariana Git',
    description:
      'Uma pizza saudável para programadores. Apresenta molho de tomate Git, cogumelos GitHub, pimentões GitLab e queijo Gitea.',
    price: { value: 29.9, discount: null },
    photo: null,
    tag: 'Pizzas',
    kitchen: 'Cozinha',
  },
  /* Lanches */
  {
    id: uuidv7(),
    name: 'Hambúrguer Stack Overflow',
    description:
      'Um hambúrguer empilhado com carne suculenta, alface fresca, cebola caramelizada e nosso molho especial StackOverflow. A resposta para sua fome!',
    price: { value: 19.9, discount: null },
    photo: null,
    tag: 'Lanches',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Hambúrguer Bug Buster',
    description:
      'Este hambúrguer é projetado para solucionar seus desejos de comida. Com carne, queijo suíço, cogumelos e maionese de depuração, ele vai resolver qualquer problema de fome.',
    price: { value: 28.5, discount: null },
    photo: null,
    tag: 'Lanches',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Hambúrguer CSS Crunch',
    description:
      'Um hambúrguer de carne com crocantes de bacon, alface, cebola roxa e um toque de CSS Crunch para dar aquela textura única. Um verdadeiro estilo de sabor!',
    price: { value: 21.5, discount: null },
    photo: null,
    tag: 'Lanches',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Sanduíche Code Cruncher',
    description:
      'Um sanduíche com carne temperada, queijo cheddar, jalapeños e nosso molho secreto de codificação. É um verdadeiro triturador de desejos de comida.',
    price: { value: 21.5, discount: null },
    photo: null,
    tag: 'Lanches',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Sanduíche API All-Star',
    description:
      'Este sanduíche estrela possui carne grelhada, alface crocante, tomate fresco e nosso famoso molho de API. Um verdadeiro MVP (Most Valuable Patty)!',
    price: { value: 23.5, discount: null },
    photo: null,
    tag: 'Lanches',
    kitchen: 'Cozinha',
  },
  /* Sobremesas */
  {
    id: uuidv7(),
    name: 'Código de Chocolate',
    description:
      'Uma delícia para os amantes de chocolate! Brownie quente, sorvete de baunilha e calda de chocolate quente, tudo coberto com pedaços de chocolate em código binário. Uma doçura que fará você sorrir em hexadecimal.',
    price: { value: 13.95, discount: null },
    photo: null,
    tag: 'Sobremesas',
    kitchen: 'Cozinha',
  },
  {
    id: uuidv7(),
    name: 'Cookie do Século XXI',
    description:
      'Um cookie gigante do século XXI, recheado com gotas de chocolate e acompanhado por uma bola de sorvete de sua escolha. Uma sobremesa que vai satisfazer até o navegador mais moderno!',
    price: { value: 11.5, discount: null },
    photo: null,
    tag: 'Sobremesas',
    kitchen: 'Cozinha',
  },
  /* Bebidas */
  {
    id: uuidv7(),
    name: 'Água Binária H2O³',
    description:
      'Uma garrafa de água cristalina, com a fórmula química H2O³, representada em código binário no rótulo. Cada gole é como uma atualização de dados para o seu corpo - mantendo os desenvolvedores funcionando em alta velocidade!',
    price: { value: 2.9, discount: null },
    photo: null,
    tag: 'Bebidas',
    kitchen: 'Balcão',
  },
  {
    id: uuidv7(),
    name: 'Cafezinho que Compila',
    description:
      'Um café forte e encorpado que vai acelerar seus neurônios para enfrentar longas sessões de codificação. Perfeito para quando o código precisa ser escrito mais rápido do que um loop infinito!',
    price: { value: 7.4, discount: null },
    photo: null,
    tag: 'Bebidas',
    kitchen: 'Balcão',
  },
  {
    id: uuidv7(),
    name: 'Energético Overflow',
    description:
      'Uma bebida energética que vai transformar você em um desenvolvedor hiperativo em um piscar de olhos. Cuidado para não programar até altas horas da noite!',
    price: { value: 6.9, discount: null },
    photo: null,
    tag: 'Bebidas',
    kitchen: 'Balcão',
  },
  {
    id: uuidv7(),
    name: 'Suco de Dados',
    description:
      'Um suco de laranja fresco que vai dar um impulso de vitamina C para o seu código. Este suco é tão refrescante quanto o seu código!',
    price: { value: 5.9, discount: null },
    photo: null,
    tag: 'Bebidas',
    kitchen: 'Balcão',
  },
];

export const DRINK_MENU_ITEMS: ReadonlyArray<MenuItem> = [
  {
    id: uuidv7(),
    name: 'HTML Hiccup',
    description:
      'Um cocktail refrescante feito com vodka, suco de limão fresco e xarope de hortelã-pimenta. Este drink é a solução para qualquer erro de código!',
    price: {
      value: 20,
      discount: 0,
    },
    photo: null,
    tag: 'Drinks',
    kitchen: 'Bar',
  },
  {
    id: uuidv7(),
    name: 'CSS Caipirinha',
    description:
      'Uma versão brasileira da caipirinha clássica, com cachaça, limão e um toque de açúcar. Este drink é a estilização perfeita para sua noite.',
    price: {
      value: 18.5,
      discount: 5,
    },
    photo: null,
    tag: 'Drinks',
    kitchen: 'Bar',
  },
  {
    id: uuidv7(),
    name: 'Java Jolt',
    description:
      'Uma bebida energizante feita com café expresso, vodka e um toque de licor de café. É o impulso que você precisa para uma noite de codificação intensa.',
    price: {
      value: 21,
      discount: null,
    },
    photo: null,
    tag: 'Drinks',
    kitchen: 'Bar',
  },
  {
    id: uuidv7(),
    name: 'Python Colada',
    description:
      'Um coquetel tropical feito com rum, suco de abacaxi e leite de coco, com uma pitada de banana. Este drink é tão flexível quanto Python!',
    price: {
      value: 19,
      discount: null,
    },
    photo: null,
    tag: 'Drinks',
    kitchen: 'Bar',
  },
  {
    id: uuidv7(),
    name: 'Firewall Flame',
    description:
      'Um coquetel ardente com tequila, licor de laranja e um toque de pimenta jalapeño. Este drink vai aquecer sua noite com um toque picante.',
    price: {
      value: 27.85,
      discount: 0,
    },
    photo: null,
    tag: 'Drinks',
    kitchen: 'Bar',
  },
  {
    id: uuidv7(),
    name: 'JavaScript on the Rocks',
    description:
      'Um coquetel intenso e equilibrado com bourbon, licor de café e uma pitada de xarope de bordo. Este drink é como a linguagem JavaScript: sempre pronto para ação.',
    price: {
      value: 47,
      discount: 20,
    },
    photo: null,
    tag: 'Drinks',
    kitchen: 'Bar',
  },
];
