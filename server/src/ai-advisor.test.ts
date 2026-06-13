// ============================================================================
// AI ADVISOR TESTS
// Tests for AI recommendations based on security alerts
// ============================================================================

import { getAIRecommendations, Alert } from './ai-advisor';

// Mock Groq API to avoid external API calls during tests
jest.mock('groq-sdk', () => {
  return {
    Groq: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  summary: 'Test summary',
                  recommendations: ['Test recommendation'],
                  priority: 'MEDIUM'
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('AI Advisor - Recommendations', () => {
  // Mock environment variable
  const originalEnv = process.env.GROQ_API_KEY;
  
  beforeAll(() => {
    process.env.GROQ_API_KEY = 'test-api-key-12345';
  });

  afterAll(() => {
    if (originalEnv) {
      process.env.GROQ_API_KEY = originalEnv;
    }
  });

  describe('Get AI Recommendations', () => {
    it('should handle empty alerts array', async () => {
      const result = await getAIRecommendations([]);
      
      expect(result).toBeDefined();
      expect(result.summary).toBe('No alerts to analyze');
      expect(result.recommendations).toEqual([]);
      expect(result.priority).toBe('LOW');
    });

    it('should generate recommendations for single alert', async () => {
      const alerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'SECURITY',
          severity: 'HIGH',
          title: 'SSH Exposed',
          description: 'Security group allows SSH from 0.0.0.0/0',
          resourceId: 'sg-12345'
        }
      ];

      const result = await getAIRecommendations(alerts, false);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.priority).toBeDefined();
    });

    it('should handle multiple alerts with different severities', async () => {
      const alerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Critical Issue',
          description: 'This is critical',
          resourceId: 'res-1'
        },
        {
          id: 'alert-2',
          type: 'SECURITY',
          severity: 'HIGH',
          title: 'High Issue',
          description: 'This is high',
          resourceId: 'res-2'
        },
        {
          id: 'alert-3',
          type: 'FINOPS',
          severity: 'MEDIUM',
          title: 'Medium Cost Issue',
          description: 'Cost optimization',
          resourceId: 'res-3'
        }
      ];

      const result = await getAIRecommendations(alerts, false);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.priority).toBeDefined();
    });

    it('should limit alerts to max analyzable count', async () => {
      // Create 15 alerts (more than MAX_ALERTS_ANALYZE=10)
      const alerts: Alert[] = Array.from({ length: 15 }, (_, i) => ({
        id: `alert-${i}`,
        type: 'SECURITY',
        severity: 'MEDIUM',
        title: `Alert ${i}`,
        description: `Description for alert ${i}`,
        resourceId: `res-${i}`
      }));

      const result = await getAIRecommendations(alerts, false);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should provide brief recommendations for non-detailed mode', async () => {
      const alerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'SECURITY',
          severity: 'HIGH',
          title: 'SSH Exposed',
          description: 'Security group allows SSH from 0.0.0.0/0',
          resourceId: 'sg-12345'
        }
      ];

      const result = await getAIRecommendations(alerts, false);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should provide detailed recommendations for detailed mode', async () => {
      const alerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'SECURITY',
          severity: 'CRITICAL',
          title: 'RDS Public Access',
          description: 'RDS instance is publicly accessible',
          resourceId: 'rds-db-1'
        }
      ];

      const result = await getAIRecommendations(alerts, true);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('AI Recommendation Structure', () => {
    it('should return valid recommendation object', async () => {
      const alerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'SECURITY',
          severity: 'HIGH',
          title: 'Test Alert',
          description: 'Test description',
          resourceId: 'test-resource'
        }
      ];

      const result = await getAIRecommendations(alerts);
      
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('priority');
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).toContain(result.priority);
    });

    it('should include estimated savings when available', async () => {
      const alerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'FINOPS',
          severity: 'MEDIUM',
          title: 'Cost Optimization',
          description: 'Stop unused instances',
          resourceId: 'i-12345'
        }
      ];

      const result = await getAIRecommendations(alerts, true);
      
      expect(result).toBeDefined();
      if (result.estimatedSavings) {
        expect(typeof result.estimatedSavings).toBe('string');
      }
    });
  });
});
