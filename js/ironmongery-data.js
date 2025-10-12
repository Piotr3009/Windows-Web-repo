// Ironmongery products data
const IRONMONGERY_DATA = {
  // Furniture finish colors
  finishColors: [
    { id: 'client-supply', name: 'Client Supply (Special Design)', hasProducts: false },
    { id: 'chrome', name: 'Chrome', hasProducts: true },
    { id: 'satin', name: 'Satin', hasProducts: true },
    { id: 'brass', name: 'Brass (Gold)', hasProducts: true },
    { id: 'antique-brass', name: 'Antique Brass', hasProducts: true },
    { id: 'black', name: 'Black', hasProducts: true },
    { id: 'white', name: 'White', hasProducts: true }
  ],

  // Product categories
  categories: {
    locks: {
      name: 'Locks',
      autoQuantity: true, // Ilość wyliczana automatycznie
      products: [
        {
          id: 'standard-lock-pas24-chrome',
          name: 'Standard Lock PAS24',
          color: 'chrome',
          isPAS24: true,
          recommended: true,
          prices: {
            net: 25.00,
            vat: 30.00
          },
          image: 'img/locks/standard-lock-chrome.jpg',
          description: 'PAS24 certified lock'
        },
        {
          id: 'standard-lock-pas24-satin',
          name: 'Standard Lock PAS24',
          color: 'satin',
          isPAS24: true,
          recommended: true,
          prices: {
            net: 25.00,
            vat: 30.00
          },
          image: 'img/locks/standard-lock-satin.jpg',
          description: 'PAS24 certified lock'
        },
        {
          id: 'standard-lock-pas24-brass',
          name: 'Standard Lock PAS24',
          color: 'brass',
          isPAS24: true,
          recommended: true,
          prices: {
            net: 27.00,
            vat: 32.40
          },
          image: 'img/locks/standard-lock-brass.jpg',
          description: 'PAS24 certified lock'
        },
        {
          id: 'standard-lock-pas24-black',
          name: 'Standard Lock PAS24',
          color: 'black',
          isPAS24: true,
          recommended: true,
          prices: {
            net: 25.00,
            vat: 30.00
          },
          image: 'img/locks/standard-lock-black.jpg',
          description: 'PAS24 certified lock'
        },
        {
          id: 'standard-lock-pas24-white',
          name: 'Standard Lock PAS24',
          color: 'white',
          isPAS24: true,
          recommended: true,
          prices: {
            net: 25.00,
            vat: 30.00
          },
          image: 'img/locks/standard-lock-white.jpg',
          description: 'PAS24 certified lock'
        }
        // TODO: Dodać inne locki (non-PAS24)
      ]
    },
    
    restrictors: {
      name: 'Restrictors',
      autoQuantity: 2, // Zawsze 2 sztuki
      products: [
        {
          id: 'angel-restrictor-chrome',
          name: 'Angel Restrictor Air Ventlock',
          color: 'chrome',
          prices: {
            net: 13.10,
            vat: 15.72
          },
          image: 'img/restrictors/angel-restrictor-chrome.jpg',
          description: 'Sash hooks, pulleys or spiral balances included'
        },
        {
          id: 'angel-restrictor-satin',
          name: 'Angel Restrictor Air Ventlock',
          color: 'satin',
          prices: {
            net: 13.10,
            vat: 15.72
          },
          image: 'img/restrictors/angel-restrictor-satin.jpg',
          description: 'Sash hooks, pulleys or spiral balances included'
        },
        {
          id: 'angel-restrictor-brass',
          name: 'Angel Restrictor Air Ventlock',
          color: 'brass',
          prices: {
            net: 14.50,
            vat: 17.40
          },
          image: 'img/restrictors/angel-restrictor-brass.jpg',
          description: 'Sash hooks, pulleys or spiral balances included'
        },
        {
          id: 'angel-restrictor-antique-brass',
          name: 'Angel Restrictor Air Ventlock',
          color: 'antique-brass',
          prices: {
            net: 14.50,
            vat: 17.40
          },
          image: 'img/restrictors/angel-restrictor-antique-brass.jpg',
          description: 'Sash hooks, pulleys or spiral balances included'
        },
        {
          id: 'angel-restrictor-black',
          name: 'Angel Restrictor Air Ventlock',
          color: 'black',
          prices: {
            net: 13.10,
            vat: 15.72
          },
          image: 'img/restrictors/angel-restrictor-black.jpg',
          description: 'Sash hooks, pulleys or spiral balances included'
        },
        {
          id: 'angel-restrictor-white',
          name: 'Angel Restrictor Air Ventlock',
          color: 'white',
          prices: {
            net: 13.10,
            vat: 15.72
          },
          image: 'img/restrictors/angel-restrictor-white.jpg',
          description: 'Sash hooks, pulleys or spiral balances included'
        }
      ]
    },

    fasteners: {
      name: 'Fasteners',
      autoQuantity: false, // User wybiera ilość
      products: [
        {
          id: 'fitch-fastener-chrome',
          name: 'Fitch Fastener',
          color: 'chrome',
          prices: {
            net: 9.25,
            vat: 11.10
          },
          image: 'img/fasteners/fitch-fastener-chrome.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'fitch-fastener-satin',
          name: 'Fitch Fastener',
          color: 'satin',
          prices: {
            net: 9.25,
            vat: 11.10
          },
          image: 'img/fasteners/fitch-fastener-satin.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'fitch-fastener-brass',
          name: 'Fitch Fastener',
          color: 'brass',
          prices: {
            net: 10.50,
            vat: 12.60
          },
          image: 'img/fasteners/fitch-fastener-brass.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'fitch-fastener-antique-brass',
          name: 'Fitch Fastener',
          color: 'antique-brass',
          prices: {
            net: 10.50,
            vat: 12.60
          },
          image: 'img/fasteners/fitch-fastener-antique-brass.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'fitch-fastener-black',
          name: 'Fitch Fastener',
          color: 'black',
          prices: {
            net: 9.25,
            vat: 11.10
          },
          image: 'img/fasteners/fitch-fastener-black.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'fitch-fastener-white',
          name: 'Fitch Fastener',
          color: 'white',
          prices: {
            net: 9.25,
            vat: 11.10
          },
          image: 'img/fasteners/fitch-fastener-white.jpg',
          description: 'Please choose 1 or 2 per sash'
        }
      ]
    },

    hooks: {
      name: 'Hooks',
      autoQuantity: false, // User wybiera ilość
      products: [
        {
          id: 'mighton-hooking-chrome',
          name: 'Mighton Hooking',
          color: 'chrome',
          prices: {
            net: 4.98,
            vat: 5.98
          },
          image: 'img/hooks/mighton-hooking-chrome.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'mighton-hooking-satin',
          name: 'Mighton Hooking',
          color: 'satin',
          prices: {
            net: 4.98,
            vat: 5.98
          },
          image: 'img/hooks/mighton-hooking-satin.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'mighton-hooking-brass',
          name: 'Mighton Hooking',
          color: 'brass',
          prices: {
            net: 5.50,
            vat: 6.60
          },
          image: 'img/hooks/mighton-hooking-brass.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'mighton-hooking-antique-brass',
          name: 'Mighton Hooking',
          color: 'antique-brass',
          prices: {
            net: 5.50,
            vat: 6.60
          },
          image: 'img/hooks/mighton-hooking-antique-brass.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'mighton-hooking-black',
          name: 'Mighton Hooking',
          color: 'black',
          prices: {
            net: 4.98,
            vat: 5.98
          },
          image: 'img/hooks/mighton-hooking-black.jpg',
          description: 'Please choose 1 or 2 per sash'
        },
        {
          id: 'mighton-hooking-white',
          name: 'Mighton Hooking',
          color: 'white',
          prices: {
            net: 4.98,
            vat: 5.98
          },
          image: 'img/hooks/mighton-hooking-white.jpg',
          description: 'Please choose 1 or 2 per sash'
        }
      ]
    }
  }
};

// Helper functions
const IronmongeryHelper = {
  // Wylicza ilość locków na podstawie konfiguracji okna
  calculateLocksQuantity: function(windowWidth, hasTransom) {
    if (windowWidth > 1200 || hasTransom) {
      return 2;
    }
    return 1;
  },

  // Sprawdza czy produkt może być wybrany przy PAS24
  canSelectWithPAS24: function(product, hasPAS24) {
    if (!hasPAS24) return true; // Jeśli nie ma PAS24, wszystko dostępne
    return product.isPAS24 === true; // Tylko produkty PAS24
  },

  // Filtruje produkty po kolorze
  getProductsByColor: function(category, colorId) {
    if (!IRONMONGERY_DATA.categories[category]) return [];
    return IRONMONGERY_DATA.categories[category].products.filter(
      product => product.color === colorId
    );
  },

  // Pobiera wszystkie produkty z kategorii
  getAllProducts: function(category) {
    if (!IRONMONGERY_DATA.categories[category]) return [];
    return IRONMONGERY_DATA.categories[category].products;
  }
};
