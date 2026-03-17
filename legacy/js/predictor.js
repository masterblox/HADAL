/**
 * Gulf Watch Prediction Engine - Phase 1
 * Rule-based scenario prediction using historical patterns
 */

class GulfPredictor {
  constructor(incidents) {
    // Filter to last 14 days for focused analysis
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    
    this.incidents = (incidents || []).filter(inc => {
      const incDate = new Date(inc.published || inc.timestamp);
      return incDate >= cutoffDate;
    });
    
    console.log(`🧠 GulfPredictor initialized with ${this.incidents.length} incidents from last 14 days`);
    
    this.patterns = this.extractPatterns();
    this.outcomes = this.calculateOutcomes();
    this.trends = this.analyzeTrends();
  }

  /**
   * Extract patterns from historical incidents
   */
  extractPatterns() {
    const patterns = {
      // Actor -> Action -> Target patterns
      actorActions: {},
      // Type-based patterns
      typeSequences: {},
      // Country-based patterns  
      countryPatterns: {},
      // Severity escalation patterns
      escalationPatterns: []
    };

    this.incidents.forEach(incident => {
      const { type, country, severity = 'low', title = '' } = incident;
      const timestamp = new Date(incident.published).getTime();

      // Track type sequences by country
      if (!patterns.typeSequences[country]) {
        patterns.typeSequences[country] = [];
      }
      patterns.typeSequences[country].push({ type, severity, timestamp, title });

      // Track country patterns
      if (!patterns.countryPatterns[country]) {
        patterns.countryPatterns[country] = {
          types: {},
          severities: {},
          total: 0
        };
      }
      patterns.countryPatterns[country].types[type] = 
        (patterns.countryPatterns[country].types[type] || 0) + 1;
      patterns.countryPatterns[country].severities[severity] = 
        (patterns.countryPatterns[country].severities[severity] || 0) + 1;
      patterns.countryPatterns[country].total++;

      // Extract actor/action from title
      const extracted = this.extractActorAction(title);
      if (extracted) {
        const key = `${extracted.actor}_${extracted.action}`;
        if (!patterns.actorActions[key]) {
          patterns.actorActions[key] = { count: 0, targets: {}, countries: {} };
        }
        patterns.actorActions[key].count++;
        patterns.actorActions[key].countries[country] = 
          (patterns.actorActions[key].countries[country] || 0) + 1;
      }
    });

    return patterns;
  }

  /**
   * Extract actor and action from incident title
   */
  extractActorAction(title) {
    if (!title) return null;
    const lower = title.toLowerCase();

    // Actor patterns
    const actors = {
      'houthi': ['houthi', 'houthis'],
      'israel': ['israel', 'israeli', 'idf'],
      'iran': ['iran', 'iranian', 'irgc'],
      'saudi': ['saudi', 'arabia', 'ksa'],
      'uae': ['uae', 'emirates', 'emirati'],
      'us': ['us', 'usa', 'american', 'pentagon'],
      'uk': ['uk', 'british', 'britain'],
      'yemen': ['yemen', 'yemeni'],
      'hezbollah': ['hezbollah', 'hizbullah'],
      'hamas': ['hamas'],
      'isis': ['isis', 'islamic state', 'daesh']
    };

    // Action patterns
    const actions = {
      'strike': ['strike', 'strikes', 'struck', 'attack', 'attacks', 'attacked'],
      'drone': ['drone', 'drones', 'uav'],
      'missile': ['missile', 'missiles', 'rocket', 'rockets', 'ballistic'],
      'intercept': ['intercept', 'intercepted', 'shot down', 'destroyed'],
      'bomb': ['bomb', 'bombing', 'explosion', 'explosive'],
      'naval': ['naval', 'ship', 'ships', 'vessel', 'houthi ship'],
      'sanction': ['sanction', 'sanctions', 'embargo'],
      'deploy': ['deploy', 'deployment', 'deployed', 'troops', 'forces']
    };

    let detectedActor = null;
    let detectedAction = null;

    for (const [actor, keywords] of Object.entries(actors)) {
      if (keywords.some(k => lower.includes(k))) {
        detectedActor = actor;
        break;
      }
    }

    for (const [action, keywords] of Object.entries(actions)) {
      if (keywords.some(k => lower.includes(k))) {
        detectedAction = action;
        break;
      }
    }

    if (detectedActor && detectedAction) {
      return { actor: detectedActor, action: detectedAction, raw: title };
    }

    return null;
  }

  /**
   * Calculate what typically happens after certain events
   */
  calculateOutcomes() {
    const outcomes = {
      // After [event type] in [country], what follows within [timeframe]
      timeframes: {
        '24h': 24 * 60 * 60 * 1000,
        '72h': 72 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      },
      patterns: {}
    };

    const sequences = this.patterns.typeSequences;

    for (const [country, events] of Object.entries(sequences)) {
      events.sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < events.length; i++) {
        const current = events[i];
        const key = `${current.type}_${country}`;

        if (!outcomes.patterns[key]) {
          outcomes.patterns[key] = {
            '24h': {},
            '72h': {},
            '7d': {},
            total: 0
          };
        }

        outcomes.patterns[key].total++;

        // Look ahead for follow-up events
        for (let j = i + 1; j < events.length; j++) {
          const next = events[j];
          const timeDiff = next.timestamp - current.timestamp;

          for (const [frame, ms] of Object.entries(outcomes.timeframes)) {
            if (timeDiff <= ms) {
              outcomes.patterns[key][frame][next.type] = 
                (outcomes.patterns[key][frame][next.type] || 0) + 1;
            }
          }
        }
      }
    }

    return outcomes;
  }

  /**
   * Analyze recent trends from last 14 days
   */
  analyzeTrends() {
    const trends = {
      escalationRate: 0,
      mostActiveActor: null,
      mostTargetedCountry: null,
      dominantEventType: null,
      dailyFrequency: [],
      hotspots: []
    };

    if (this.incidents.length === 0) return trends;

    // Group by day
    const byDay = {};
    const byActor = {};
    const byCountry = {};
    const byType = {};

    this.incidents.forEach(inc => {
      const day = new Date(inc.published).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      // Extract actor
      const extracted = this.extractActorAction(inc.title);
      if (extracted) {
        byActor[extracted.actor] = (byActor[extracted.actor] || 0) + 1;
      }

      // Country
      const country = inc.location?.country || inc.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;

      // Type
      byType[inc.type] = (byType[inc.type] || 0) + 1;
    });

    // Calculate trends
    const days = Object.keys(byDay).length || 1;
    trends.dailyFrequency = Object.entries(byDay).map(([date, count]) => ({ date, count }));
    
    // Most active actor
    trends.mostActiveActor = Object.entries(byActor)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    // Most targeted country
    trends.mostTargetedCountry = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    // Dominant event type
    trends.dominantEventType = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Escalation rate (events in last 3 days vs first 3 days)
    const sortedDays = trends.dailyFrequency.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sortedDays.length >= 6) {
      const earlyCount = sortedDays.slice(0, 3).reduce((sum, d) => sum + d.count, 0);
      const lateCount = sortedDays.slice(-3).reduce((sum, d) => sum + d.count, 0);
      trends.escalationRate = earlyCount > 0 ? ((lateCount - earlyCount) / earlyCount * 100).toFixed(1) : 0;
    }

    return trends;
  }

  /**
   * Get trend summary for display
   */
  getTrendSummary() {
    const { mostActiveActor, mostTargetedCountry, dominantEventType, escalationRate } = this.trends;
    const total = this.incidents.length;
    
    return {
      summary: `Last 14 days: ${total} incidents. ${mostActiveActor ? mostActiveActor.toUpperCase() + ' most active' : 'No clear actor pattern'}. ${escalationRate > 0 ? escalationRate + '% escalation trend' : 'Stable activity'}.`,
      hotspots: this.trends.hotspots,
      dailyAvg: (total / 14).toFixed(1)
    };
  }

  /**
   * Main prediction method
   */
  predict(scenario) {
    const { actor, action, target, country } = scenario;
    const predictions = [];

    // 0. Trend-based prediction (NEW - based on last 14 days)
    if (this.trends.escalationRate > 10) {
      predictions.push({
        category: 'Escalation Alert',
        outcome: `Activity up ${this.trends.escalationRate}% in last 3 days`,
        probability: Math.min(50 + parseFloat(this.trends.escalationRate), 90),
        timeframe: 'Next 48-72 hours',
        confidence: `Based on ${this.incidents.length} recent incidents`
      });
    }

    // 1. Pattern-based prediction
    const patternKey = `${actor}_${action}`;
    const actorPattern = this.patterns.actorActions[patternKey];

    if (actorPattern) {
      // Find most common follow-up countries
      const countries = Object.entries(actorPattern.countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (countries.length > 0) {
        predictions.push({
          category: 'Regional Response',
          outcome: `Escalation likely in ${countries.map(c => c[0].toUpperCase()).join(', ')}`,
          probability: Math.min(60 + (countries[0][1] * 5), 95),
          timeframe: '24-72 hours',
          confidence: 'Based on historical patterns'
        });
      }
    }

    // 2. Type-based prediction
    if (country) {
      const typeKey = `${action}_${country}`;
      const typeOutcomes = this.outcomes.patterns[typeKey];

      if (typeOutcomes) {
        for (const [timeframe, types] of Object.entries(typeOutcomes)) {
          if (timeframe === 'total') continue;

          const sorted = Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

          sorted.forEach(([type, count]) => {
            const prob = Math.round((count / typeOutcomes.total) * 100);
            predictions.push({
              category: 'Follow-up Event',
              outcome: `${this.formatType(type)} activity`,
              probability: prob,
              timeframe: this.formatTimeframe(timeframe),
              confidence: `${count} of ${typeOutcomes.total} similar events`
            });
          });
        }
      }
    }

    // 3. Default predictions based on action type
    const defaultPredictions = this.getDefaultPredictions(actor, action, target);
    predictions.push(...defaultPredictions);

    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);

    // Remove duplicates and limit
    const seen = new Set();
    return predictions.filter(p => {
      const key = `${p.category}_${p.outcome}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }

  /**
   * Default predictions when no historical data
   */
  getDefaultPredictions(actor, action, target) {
    const defaults = [];

    // Missile/drone strike patterns
    if (['missile', 'drone', 'strike'].includes(action)) {
      defaults.push(
        {
          category: 'Military Response',
          outcome: 'Retaliatory strikes or defense activation',
          probability: 75,
          timeframe: 'Within 48 hours',
          confidence: 'Standard military doctrine'
        },
        {
          category: 'Market Impact',
          outcome: 'Oil price volatility (+2-5%)',
          probability: 60,
          timeframe: '24 hours',
          confidence: 'Historical commodity response'
        },
        {
          category: 'Diplomatic Response',
          outcome: 'Emergency consultations or condemnations',
          probability: 45,
          timeframe: '24-72 hours',
          confidence: 'Standard diplomatic protocol'
        }
      );
    }

    // Naval action patterns
    if (['naval', 'ship'].includes(action)) {
      defaults.push(
        {
          category: 'Maritime Security',
          outcome: 'Increased naval patrols in region',
          probability: 70,
          timeframe: '48-96 hours',
          confidence: 'Standard naval response'
        },
        {
          category: 'Shipping Impact',
          outcome: 'Insurance premiums rise, route changes',
          probability: 55,
          timeframe: '1-2 weeks',
          confidence: 'Market response pattern'
        }
      );
    }

    // Interception patterns
    if (['intercept'].includes(action)) {
      defaults.push(
        {
          category: 'Escalation Risk',
          outcome: 'Attacker may attempt follow-up strikes',
          probability: 65,
          timeframe: '24-48 hours',
          confidence: 'Post-interception patterns'
        },
        {
          category: 'Defense Posture',
          outcome: 'Heightened alert status maintained',
          probability: 80,
          timeframe: '7+ days',
          confidence: 'Standard defense protocol'
        }
      );
    }

    // Default for unknown actions
    if (defaults.length === 0) {
      defaults.push(
        {
          category: 'Monitoring',
          outcome: 'Continued surveillance and analysis',
          probability: 90,
          timeframe: 'Ongoing',
          confidence: 'Standard procedure'
        },
        {
          category: 'Diplomatic',
          outcome: 'Official statements from involved parties',
          probability: 70,
          timeframe: '24 hours',
          confidence: 'Standard protocol'
        }
      );
    }

    return defaults;
  }

  /**
   * Get available actors for dropdown
   */
  getActors() {
    return [
      { id: 'houthi', name: 'Houthis (Yemen)', region: 'Yemen' },
      { id: 'israel', name: 'Israel / IDF', region: 'Israel' },
      { id: 'iran', name: 'Iran / IRGC', region: 'Iran' },
      { id: 'saudi', name: 'Saudi Arabia', region: 'Saudi Arabia' },
      { id: 'uae', name: 'UAE', region: 'UAE' },
      { id: 'us', name: 'United States', region: 'US' },
      { id: 'uk', name: 'United Kingdom', region: 'UK' },
      { id: 'hezbollah', name: 'Hezbollah', region: 'Lebanon' },
      { id: 'hamas', name: 'Hamas', region: 'Palestine' },
      { id: 'isis', name: 'ISIS/ISIL', region: 'Regional' }
    ];
  }

  /**
   * Get available actions for dropdown
   */
  getActions() {
    return [
      { id: 'strike', name: 'Airstrike / Attack' },
      { id: 'missile', name: 'Missile Launch' },
      { id: 'drone', name: 'Drone Attack' },
      { id: 'naval', name: 'Naval Action' },
      { id: 'intercept', name: 'Intercept / Defense' },
      { id: 'bomb', name: 'Bombing / Explosion' },
      { id: 'deploy', name: 'Troop Deployment' },
      { id: 'sanction', name: 'Sanctions' }
    ];
  }

  /**
   * Get available targets for dropdown
   */
  getTargets() {
    return [
      { id: 'oil_facility', name: 'Oil Facility' },
      { id: 'military_base', name: 'Military Base' },
      { id: 'civilian_area', name: 'Civilian Area' },
      { id: 'shipping', name: 'Commercial Shipping' },
      { id: 'naval_vessel', name: 'Naval Vessel' },
      { id: 'infrastructure', name: 'Infrastructure' },
      { id: 'airport', name: 'Airport' },
      { id: 'port', name: 'Port' }
    ];
  }

  /**
   * Get available countries
   */
  getCountries() {
    return [
      { id: 'uae', name: 'UAE' },
      { id: 'saudi', name: 'Saudi Arabia' },
      { id: 'qatar', name: 'Qatar' },
      { id: 'bahrain', name: 'Bahrain' },
      { id: 'kuwait', name: 'Kuwait' },
      { id: 'oman', name: 'Oman' },
      { id: 'israel', name: 'Israel' },
      { id: 'iran', name: 'Iran' },
      { id: 'yemen', name: 'Yemen' },
      { id: 'iraq', name: 'Iraq' },
      { id: 'lebanon', name: 'Lebanon' }
    ];
  }

  formatType(type) {
    const formats = {
      'air_defense': 'Air Defense',
      'attack': 'Attack',
      'alert': 'Alert',
      'security': 'Security',
      'missile': 'Missile',
      'drone': 'Drone'
    };
    return formats[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatTimeframe(frame) {
    const formats = {
      '24h': 'Within 24 hours',
      '72h': 'Within 72 hours',
      '7d': 'Within 7 days'
    };
    return formats[frame] || frame;
  }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GulfPredictor;
}
