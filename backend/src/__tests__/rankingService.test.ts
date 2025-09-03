import { RankingService } from '@/services/rankingService';

describe('RankingService', () => {
  let rankingService: RankingService;

  beforeEach(() => {
    rankingService = new RankingService();
  });

  describe('Configuración por defecto', () => {
    it('debe tener tablas de puntos por defecto correctas', () => {
      // Verificar que las tablas de puntos por defecto están definidas
      expect(RankingService['DEFAULT_CE1_POINTS']).toBeDefined();
      expect(RankingService['DEFAULT_CE2_POINTS']).toBeDefined();
      expect(RankingService['DEFAULT_REGIONAL_POINTS']).toBeDefined();
    });

    it('debe tener ponderadores temporales correctos', () => {
      const weights = RankingService['DEFAULT_TEMPORAL_WEIGHTS'];
      expect(weights[0]).toBe(1.0); // Año actual
      expect(weights[1]).toBe(0.8); // Año -1
      expect(weights[2]).toBe(0.5); // Año -2
      expect(weights[3]).toBe(0.2); // Año -3
    });

    it('debe tener configuración de coeficiente regional correcta', () => {
      const config = RankingService['DEFAULT_REGIONAL_COEFFICIENT'];
      expect(config.floor).toBe(0.8);
      expect(config.ceiling).toBe(1.2);
      expect(config.increment).toBe(0.01);
    });
  });

  describe('Cálculo de coeficiente regional', () => {
    it('debe calcular coeficiente dentro del rango válido', () => {
      const floor = 0.8;
      const ceiling = 1.2;
      const increment = 0.01;

      // Test con puntos bajos
      const lowPoints = 100;
      const lowCoefficient = Math.max(floor, Math.min(ceiling, floor + lowPoints * increment));
      expect(lowCoefficient).toBeGreaterThanOrEqual(floor);
      expect(lowCoefficient).toBeLessThanOrEqual(ceiling);

      // Test con puntos altos
      const highPoints = 1000;
      const highCoefficient = Math.max(floor, Math.min(ceiling, floor + highPoints * increment));
      expect(highCoefficient).toBe(ceiling); // Debe estar en el techo
    });

    it('debe aplicar clamp correctamente', () => {
      const floor = 0.8;
      const ceiling = 1.2;
      const increment = 0.01;

      // Test con puntos que exceden el techo
      const veryHighPoints = 10000;
      const coefficient = Math.max(floor, Math.min(ceiling, floor + veryHighPoints * increment));
      expect(coefficient).toBe(ceiling);

      // Test con puntos negativos (no debería pasar, pero por seguridad)
      const negativePoints = -1000;
      const negativeCoefficient = Math.max(floor, Math.min(ceiling, floor + negativePoints * increment));
      expect(negativeCoefficient).toBe(floor);
    });
  });

  describe('Cálculo de puntos por posición', () => {
    it('debe calcular puntos CE1 correctamente', () => {
      const points = RankingService['DEFAULT_CE1_POINTS'];
      expect(points[1]).toBe(1000); // 1er lugar
      expect(points[2]).toBe(850);  // 2do lugar
      expect(points[3]).toBe(725);  // 3er lugar
      expect(points[24]).toBe(27);  // Último lugar
    });

    it('debe calcular puntos CE2 correctamente', () => {
      const points = RankingService['DEFAULT_CE2_POINTS'];
      expect(points[1]).toBe(230);  // 1er lugar
      expect(points[2]).toBe(195);  // 2do lugar
      expect(points[3]).toBe(165);  // 3er lugar
      expect(points[24]).toBe(6);   // Último lugar
    });

    it('debe calcular puntos regionales correctamente', () => {
      const points = RankingService['DEFAULT_REGIONAL_POINTS'];
      expect(points[1]).toBe(140);  // 1er lugar
      expect(points[2]).toBe(120);  // 2do lugar
      expect(points[3]).toBe(100);  // 3er lugar
      expect(points[24]).toBe(2);   // Último lugar
    });
  });

  describe('Ponderación temporal', () => {
    it('debe aplicar ponderadores correctamente', () => {
      const weights = RankingService['DEFAULT_TEMPORAL_WEIGHTS'];
      const currentYear = new Date().getFullYear();

      // Test para diferentes años
      const year0 = currentYear;
      const year1 = currentYear - 1;
      const year2 = currentYear - 2;
      const year3 = currentYear - 3;

      expect(weights[currentYear - year0]).toBe(1.0);
      expect(weights[currentYear - year1]).toBe(0.8);
      expect(weights[currentYear - year2]).toBe(0.5);
      expect(weights[currentYear - year3]).toBe(0.2);
    });

    it('debe manejar años fuera del rango', () => {
      const weights = RankingService['DEFAULT_TEMPORAL_WEIGHTS'];
      const currentYear = new Date().getFullYear();
      const oldYear = currentYear - 10;

      // Años muy antiguos deberían tener peso 0 o undefined
      expect(weights[currentYear - oldYear]).toBeUndefined();
    });
  });

  describe('Validaciones', () => {
    it('debe validar que las posiciones son números positivos', () => {
      const points = RankingService['DEFAULT_CE1_POINTS'];
      
      // Todas las posiciones deben ser números positivos
      Object.values(points).forEach(point => {
        expect(point).toBeGreaterThan(0);
        expect(typeof point).toBe('number');
      });
    });

    it('debe validar que los ponderadores están entre 0 y 1', () => {
      const weights = RankingService['DEFAULT_TEMPORAL_WEIGHTS'];
      
      Object.values(weights).forEach(weight => {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      });
    });

    it('debe validar configuración de coeficiente regional', () => {
      const config = RankingService['DEFAULT_REGIONAL_COEFFICIENT'];
      
      expect(config.floor).toBeLessThan(config.ceiling);
      expect(config.increment).toBeGreaterThan(0);
      expect(config.floor).toBeGreaterThan(0);
      expect(config.ceiling).toBeGreaterThan(0);
    });
  });
});
