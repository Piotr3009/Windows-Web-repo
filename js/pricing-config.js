// pricing-config.js - Zaawansowana konfiguracja cennika
const pricingConfig = {
  // Cena bazowa za m²
  basePricePerSqm: 1000,
  
  // Mnożniki degresywne - im większe okno, tym taniej za m²
  sizeMultipliers: [
    { maxSqm: 0.6, multiplier: 1.25 },   // małe okna +25%
    { maxSqm: 1.0, multiplier: 1.0 },    // bazowa cena
    { maxSqm: 1.5, multiplier: 0.95 },   // -5%
    { maxSqm: 2.0, multiplier: 0.9 },    // -10%
    { maxSqm: 3.0, multiplier: 0.85 },   // -15%
    { maxSqm: 999, multiplier: 0.8 }     // duże okna -20%
  ],
  
  // Ceny za szprosy Georgian bars
  barPricing: {
    pricePerBar: 15,  // 15£ za jeden bar
    
    // Liczba barów dla każdego wzoru (PER SASH, nie x2!)
    barsPerPattern: {
      'none': 0,
      '2x2': 2,        // 1 pionowy + 1 poziomy = 2
      '3x3': 4,        // 2 pionowe + 2 poziome = 4
      '4x4': 4,        // 2 pionowe + 2 poziome = 4
      '6x6': 5,        // 2 pionowe + 3 poziome = 5
      '9x9': 8,        // 4 pionowe + 4 poziome = 8
      '2-vertical': 2, // 2 pionowe
      '1-vertical': 1, // 1 pionowy
      'custom': null   // będzie liczone dynamicznie
    }
  },
  
  // Dodatkowe opcje cenowe (na przyszłość)
  additionalOptions: {
    // Frame
    frameTypes: {
      'standard': 0,      // bez dopłaty
      'slim': 50          // +50£ za slim frame
    },
    
    // Glass
    glassTypes: {
      'double': 0,        // bazowe
      'triple': 150,      // +150£
      'passive': 250      // +250£
    },
    
    // Glass specification
    glassSpec: {
      'toughened': 0,     // bazowe
      'laminated': 100    // +100£
    },
    
    // Glass finish
    glassFinish: {
      'clear': 0,         // bazowe
      'frosted': 80       // +80£
    },
    
    // Horns
    horns: {
      'none': 0,
      'standard': 20,
      'deep': 35,
      'traditional': 50
    },
    
    // Ironmongery
    ironmongery: {
      'none': 0,
      'black': 40,
      'chrome': 50,
      'gold': 60
    },
    
    // Opening mechanism
    openingTypes: {
      'both': 0,          // bazowe
      'bottom': -30,      // -30£ (taniej)
      'fixed': -50        // -50£ (taniej)
    },
    
    // Color
    colorTypes: {
      'single': 0,        // bazowe
      'dual': 100         // +100£ za dual color
    },
    
    // Security
    pas24: {
      'no': 0,
      'yes': 100          // +100£ za PAS24
    }
  },
  
  // Rabaty ilościowe
  quantityDiscounts: [
    { minQty: 1, discount: 0 },     // 1-4 okna: 0%
    { minQty: 5, discount: 0.05 },  // 5-9 okien: -5%
    { minQty: 10, discount: 0.10 }, // 10+ okien: -10%
    { minQty: 20, discount: 0.15 }  // 20+ okien: -15%
  ],
  
  // VAT
  vatRate: 0.20  // 20% VAT
};

// Export dla użycia w innych modułach
window.pricingConfig = pricingConfig;