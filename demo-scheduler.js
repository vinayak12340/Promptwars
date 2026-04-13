// ============================================================
// NEXUS SMART VENUE - DEMO EVENT SCHEDULER
// Realistic event timeline with ML predictions & recommendations
// ============================================================

class EventScheduler {
  constructor() {
    this.eventStartTime = new Date();
    this.phases = this.initializeEventPhases();
    this.currentPhase = null;
    this.demoStartTime = Date.now();
    this.demoSpeedMultiplier = 600; // 1 real second = 10 minutes in demo (100x speed)
  }

  initializeEventPhases() {
    return [
      {
        name: 'PRE-GAME',
        startMin: -45,
        endMin: 0,
        color: '#38bdf8',
        crowdDensity: 0.3,
        demandMultiplier: 0.5,
        avgWaitTime: 3,
        staffNeeded: 15,
        description: 'Gates opening, early arrivals'
      },
      {
        name: '1ST QUARTER',
        startMin: 0,
        endMin: 15,
        color: '#0ea5e9',
        crowdDensity: 0.65,
        demandMultiplier: 0.8,
        avgWaitTime: 5,
        staffNeeded: 25,
        description: 'Action on field, stable concession traffic'
      },
      {
        name: '2ND QUARTER',
        startMin: 15,
        endMin: 30,
        color: '#06b6d4',
        crowdDensity: 0.85,
        demandMultiplier: 1.1,
        avgWaitTime: 7,
        staffNeeded: 35,
        description: 'Building momentum, increased bathroom traffic'
      },
      {
        name: '🏆 HALFTIME 🏆',
        startMin: 30,
        endMin: 45,
        color: '#f59e0b',
        crowdDensity: 2.8,
        demandMultiplier: 3.5,
        avgWaitTime: 18,
        staffNeeded: 65,
        description: '⚡ PEAK RUSH - Maximum concessions activity'
      },
      {
        name: '3RD QUARTER',
        startMin: 45,
        endMin: 60,
        color: '#ec4899',
        crowdDensity: 0.9,
        demandMultiplier: 1.2,
        avgWaitTime: 8,
        staffNeeded: 40,
        description: 'Resuming action, delayed returns'
      },
      {
        name: '4TH QUARTER',
        startMin: 60,
        endMin: 75,
        color: '#8b5cf6',
        crowdDensity: 0.7,
        demandMultiplier: 0.9,
        avgWaitTime: 6,
        staffNeeded: 30,
        description: 'Final push, anxious viewers'
      },
      {
        name: 'POST-GAME',
        startMin: 75,
        endMin: 120,
        color: '#ef4444',
        crowdDensity: 1.8,
        demandMultiplier: 1.5,
        avgWaitTime: 12,
        staffNeeded: 50,
        description: 'Celebration/disappointment, exit surge'
      }
    ];
  }

  // Get current event phase based on demo time
  getCurrentPhase() {
    const elapsedSeconds = (Date.now() - this.demoStartTime) / 1000;
    const elapsedMinutes = (elapsedSeconds * this.demoSpeedMultiplier) / 60;

    return this.phases.find(p => 
      elapsedMinutes >= p.startMin && elapsedMinutes < p.endMin
    );
  }

  // Get progress within current phase (0-1)
  getPhaseProgress() {
    const phase = this.getCurrentPhase();
    if (!phase) return 0;

    const elapsedSeconds = (Date.now() - this.demoStartTime) / 1000;
    const elapsedMinutes = (elapsedSeconds * this.demoSpeedMultiplier) / 60;
    const phaseDuration = phase.endMin - phase.startMin;
    const phaseElapsed = elapsedMinutes - phase.startMin;

    return Math.min(1, Math.max(0, phaseElapsed / phaseDuration));
  }

  // ML Demand Forecast for current phase
  generateDemandForecast() {
    const phase = this.getCurrentPhase();
    if (!phase) return [];

    const items = [
      { name: 'Hot Dog', baseWait: 5, price: 8, popularity: 9.2 },
      { name: 'Premium Beer', baseWait: 2, price: 12, popularity: 9.5 },
      { name: 'Nachos', baseWait: 8, price: 10, popularity: 8.7 },
      { name: 'Soda', baseWait: 1, price: 6, popularity: 7.8 },
      { name: 'Popcorn', baseWait: 2, price: 7, popularity: 8.2 }
    ];

    return items.map(item => ({
      ...item,
      predictedWait: Math.round(item.baseWait * phase.demandMultiplier),
      demandLevel: this.getDemandLevel(phase.demandMultiplier),
      recommendation: phase.demandMultiplier < 1.5 ? 'Order now!' : 'Wait a bit'
    }));
  }

  // ML Crowd Density Prediction
  generateCrowdPrediction() {
    const phase = this.getCurrentPhase();
    if (!phase) return [];

    const predictions = [
      {
        location: phase.name === '🏆 HALFTIME 🏆' ? 'Concourse B (Food)' : 'Gate A (Entrance)',
        currentDensity: Math.round(phase.crowdDensity * 100),
        fiveMinPrediction: Math.round(phase.crowdDensity * 95),
        fifteenMinPrediction: this.getNextPhaseDensity(),
        severity: this.getDensitySeverity(phase.crowdDensity),
        action: this.getStaffingRecommendation(phase)
      },
      {
        location: 'Restrooms (North Wing)',
        currentDensity: Math.round(phase.crowdDensity * 110),
        fiveMinPrediction: Math.round(phase.crowdDensity * 120),
        fifteenMinPrediction: Math.round(phase.crowdDensity * 100),
        severity: this.getDensitySeverity(phase.crowdDensity * 1.1),
        action: 'Deploy 2 additional staff members'
      },
      {
        location: 'Stadium Floor (Center)',
        currentDensity: Math.round(phase.crowdDensity * 85),
        fiveMinPrediction: Math.round(phase.crowdDensity * 90),
        fifteenMinPrediction: Math.round(phase.crowdDensity * 95),
        severity: this.getDensitySeverity(phase.crowdDensity * 0.85),
        action: 'Monitor for next 10 minutes'
      }
    ];

    return predictions;
  }

  getNextPhaseDensity() {
    const currentPhaseIndex = this.phases.indexOf(this.getCurrentPhase());
    const nextPhase = this.phases[currentPhaseIndex + 1];
    return nextPhase ? Math.round(nextPhase.crowdDensity * 100) : 50;
  }

  getDensitySeverity(density) {
    if (density > 2.0) return { level: 'CRITICAL 🚨', class: 'critical' };
    if (density > 1.3) return { level: 'HIGH 🔴', class: 'high' };
    if (density > 0.8) return { level: 'MEDIUM 🟡', class: 'medium' };
    return { level: 'NORMAL 🟢', class: 'normal' };
  }

  getDemandLevel(multiplier) {
    if (multiplier > 3) return 'EXTREME 🚀';
    if (multiplier > 1.5) return 'HIGH ⚡';
    if (multiplier > 1) return 'MODERATE ↗️';
    return 'LOW ↙️';
  }

  getStaffingRecommendation(phase) {
    if (phase.staffNeeded > 50) return `🚨 URGENT: Deploy ${phase.staffNeeded} staff members NOW`;
    if (phase.staffNeeded > 35) return `⚠️ Deploy ${phase.staffNeeded} staff, anticipate peak`;
    return `✅ Current ${phase.staffNeeded} staff adequate`;
  }

  // ML Revenue Forecast
  generateRevenueForecasts() {
    const phase = this.getCurrentPhase();
    if (!phase) return [];

    const baseRevenue = {
      concessions: 12450,
      merchandise: 5230,
      premium: 18900
    };

    return [
      {
        category: 'Concessions',
        baseRevenue: baseRevenue.concessions,
        predicted: Math.round(baseRevenue.concessions * phase.demandMultiplier),
        trend: phase.demandMultiplier > 1 ? '+' : '',
        trendPercent: Math.round((phase.demandMultiplier - 1) * 100),
        topItem: phase.demandMultiplier > 2 ? 'Premium Beer' : 'Hot Dogs'
      },
      {
        category: 'Merchandise',
        baseRevenue: baseRevenue.merchandise,
        predicted: Math.round(baseRevenue.merchandise * (phase.demandMultiplier * 0.7)),
        trend: phase.demandMultiplier > 1.2 ? '+' : '',
        trendPercent: Math.round((phase.demandMultiplier * 0.7 - 1) * 100)
      },
      {
        category: 'Premium Seating',
        baseRevenue: baseRevenue.premium,
        predicted: Math.round(baseRevenue.premium * 1.0),
        trend: phase.demandMultiplier > 1 ? '+' : '',
        trendPercent: 0
      }
    ];
  }

  // ML Anomaly Detection
  generateAnomalies() {
    const phase = this.getCurrentPhase();
    const anomalies = [];

    // Check for unexpected patterns
    if (phase.demandMultiplier > 2.5 && Math.random() > 0.7) {
      anomalies.push({
        type: 'demand_spike',
        severity: 'warning',
        message: '⚠️ Demand spike detected beyond normal patterns',
        action: 'Check for special promotions or events'
      });
    }

    if (phase.crowdDensity > 1.5 && Math.random() > 0.6) {
      anomalies.push({
        type: 'overcrowding',
        severity: 'critical',
        message: '🚨 Abnormal crowd density - Consider evacuation alert',
        action: 'Deploy emergency staff to Concourse B'
      });
    }

    if (phase.name === '🏆 HALFTIME 🏆' && Math.random() > 0.5) {
      anomalies.push({
        type: 'system_load',
        severity: 'info',
        message: '💡 Peak system load detected - All systems nominal',
        action: 'Monitor API response times'
      });
    }

    return anomalies;
  }

  // Smart recommendations based on current phase
  getSmartRecommendations() {
    const phase = this.getCurrentPhase();
    if (!phase) return [];

    const recommendations = {
      'PRE-GAME': [
        '✅ Staff levels adequate - prepare for surge',
        '📍 Position signage for facility directions',
        '💰 Prepare dynamic pricing for peak times'
      ],
      '1ST QUARTER': [
        '🍺 Monitor Beer queue - may exceed capacity',
        '📊 Revenue tracking normal',
        '👥 Deploy additional restroom attendants'
      ],
      '2ND QUARTER': [
        '⚠️ Begin halftime prep - alert all stations',
        '🚀 Expect 3-5x demand in next 10 minutes',
        '👷 Position additional staff at concessions'
      ],
      '🏆 HALFTIME 🏆': [
        '🚨 PEAK RUSH - All hands on deck',
        '⏰ Average wait times: 18+ minutes',
        '💡 Recommend digital menu boards update pricing',
        '📢 Send push notifications for expedited ordering'
      ],
      '3RD QUARTER': [
        '📉 Demand declining - optimize staffing',
        '🎯 Focus on delayed returners',
        '💼 Begin post-game prep'
      ],
      '4TH QUARTER': [
        '⏳ Finalize operations - game concluding',
        '🚪 Prepare exit crowd management',
        '📊 Monitor for final surge'
      ],
      'POST-GAME': [
        '🚨 CRITICAL - Exit surge management',
        '👥 Deploy all staff for crowd control',
        '🚴 Activate emergency protocols if needed'
      ]
    };

    return recommendations[phase.name] || [];
  }

  // Get current time in demo (simulated event time)
  getCurrentEventTime() {
    const elapsedSeconds = (Date.now() - this.demoStartTime) / 1000;
    const elapsedMinutes = (elapsedSeconds * this.demoSpeedMultiplier) / 60;
    const eventStartMinutes = -45; // Demo starts 45 min before game
    const totalMinutes = eventStartMinutes + elapsedMinutes;

    const hours = Math.floor(Math.abs(totalMinutes) / 60);
    const minutes = Math.floor(Math.abs(totalMinutes) % 60);

    if (totalMinutes < 0) {
      return `T- ${hours}:${minutes.toString().padStart(2, '0')} (Pre-Game)`;
    }
    return `${hours}:${minutes.toString().padStart(2, '0')} (In Progress)`;
  }
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventScheduler;
}

// ============================================================
// DEMO INTEGRATION
// ============================================================

// Create global scheduler instance
const demoScheduler = new EventScheduler();

// Update dashboard in real-time
function updateDemoDashboard() {
  const phase = demoScheduler.getCurrentPhase();
  if (!phase) return;

  // Update phase indicator
  const phaseDisplay = document.getElementById('currentPhaseDemo');
  if (phaseDisplay) {
    phaseDisplay.innerHTML = `
      <div class="phase-badge" style="background-color: ${phase.color}">
        <strong>${phase.name}</strong>
        <div class="phase-description">${phase.description}</div>
        <div class="phase-progress" style="width: ${demoScheduler.getPhaseProgress() * 100}%"></div>
      </div>
    `;
  }

  // Update demand forecast
  const demandDisplay = document.getElementById('demoDemandForecast');
  if (demandDisplay) {
    const forecast = demoScheduler.generateDemandForecast();
    demandDisplay.innerHTML = forecast.map(item => `
      <div class="demo-forecast-item">
        <span>${item.name}</span>
        <span>${item.predictedWait}m wait</span>
        <span>${item.demandLevel}</span>
      </div>
    `).join('');
  }

  // Update crowd predictions
  const crowdDisplay = document.getElementById('demoCrowdPrediction');
  if (crowdDisplay) {
    const predictions = demoScheduler.generateCrowdPrediction();
    crowdDisplay.innerHTML = predictions.map(pred => `
      <div class="demo-prediction-item ${pred.severity.class}">
        <strong>${pred.location}</strong>
        <div>Current: ${pred.currentDensity}% | Predicted (15m): ${pred.fifteenMinPrediction}%</div>
        <div>${pred.action}</div>
      </div>
    `).join('');
  }

  // Update recommendations
  const recDisplay = document.getElementById('demoRecommendations');
  if (recDisplay) {
    const recs = demoScheduler.getSmartRecommendations();
    recDisplay.innerHTML = recs.map(rec => `<div class="demo-rec">${rec}</div>`).join('');
  }

  // Update event time
  const timeDisplay = document.getElementById('demoEventTime');
  if (timeDisplay) {
    timeDisplay.textContent = demoScheduler.getCurrentEventTime();
  }
}

// Start continuous updates
setInterval(updateDemoDashboard, 1000);
updateDemoDashboard(); // Initial call
