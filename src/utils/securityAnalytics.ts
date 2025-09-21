/**
 * Security Analytics Utilities
 * Functions for analyzing security patterns, threats, and metrics
 */

import { createLogger } from './logger';

const logger = createLogger('SecurityAnalytics');

export interface LoginAttemptAnalysis {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  suspiciousAttempts: number;
  uniqueDevices: number;
  uniqueIPs: number;
  averageSessionDuration: number;
  peakHours: number[];
  riskScore: number;
}

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'suspicious_location' | 'device_anomaly' | 'session_hijack' | 'credential_stuffing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  description: string;
  indicators: string[];
  recommendedActions: string[];
  detectedAt: Date;
  affectedUsers?: string[];
}

export interface SecurityMetrics {
  accountSecurity: {
    score: number; // 0-100
    factors: {
      passwordStrength: number;
      deviceTrust: number;
      sessionSecurity: number;
      activityPattern: number;
    };
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
  };
  recommendations: string[];
}

/**
 * Analyze login attempts for patterns and anomalies
 */
export function analyzeLoginAttempts(attempts: any[]): LoginAttemptAnalysis {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      successRate: 0,
      suspiciousAttempts: 0,
      uniqueDevices: 0,
      uniqueIPs: 0,
      averageSessionDuration: 0,
      peakHours: [],
      riskScore: 0
    };
  }

  const totalAttempts = attempts.length;
  const successfulAttempts = attempts.filter(a => a.success).length;
  const failedAttempts = totalAttempts - successfulAttempts;
  const successRate = (successfulAttempts / totalAttempts) * 100;

  // Detect suspicious patterns
  let suspiciousAttempts = 0;
  const deviceMap = new Map();
  const ipMap = new Map();
  const hourCounts = new Array(24).fill(0);

  attempts.forEach(attempt => {
    // Count devices and IPs
    if (attempt.device_fingerprint) {
      deviceMap.set(attempt.device_fingerprint, true);
    }
    if (attempt.ip_address) {
      ipMap.set(attempt.ip_address, true);
    }

    // Count hourly distribution
    const hour = new Date(attempt.created_at).getHours();
    hourCounts[hour]++;

    // Check for suspicious indicators
    if (attempt.suspicious_flags && attempt.suspicious_flags.length > 0) {
      suspiciousAttempts++;
    }

    // Additional suspicious patterns
    if (attempt.failure_reason && 
        (attempt.failure_reason.includes('unusual') || 
         attempt.failure_reason.includes('suspicious'))) {
      suspiciousAttempts++;
    }
  });

  // Find peak hours (top 3 hours with most activity)
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.hour);

  // Calculate risk score
  let riskScore = 0;
  if (successRate < 50) riskScore += 30; // Low success rate
  if (suspiciousAttempts > totalAttempts * 0.1) riskScore += 25; // >10% suspicious
  if (failedAttempts > 10) riskScore += 20; // Many failures
  if (deviceMap.size > 5) riskScore += 15; // Many devices
  if (ipMap.size > 3) riskScore += 10; // Many IPs

  return {
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    successRate,
    suspiciousAttempts,
    uniqueDevices: deviceMap.size,
    uniqueIPs: ipMap.size,
    averageSessionDuration: 0, // Would need session data
    peakHours,
    riskScore: Math.min(100, riskScore)
  };
}

/**
 * Detect security threats based on patterns
 */
export function detectSecurityThreats(
  loginAttempts: any[],
  devices: any[],
  sessionInfo: any
): SecurityThreat[] {
  const threats: SecurityThreat[] = [];
  const now = new Date();

  // Brute force detection
  const recentFailures = loginAttempts.filter(attempt => 
    !attempt.success && 
    new Date(attempt.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
  );

  if (recentFailures.length >= 10) {
    threats.push({
      id: `brute-force-${now.getTime()}`,
      type: 'brute_force',
      severity: 'high',
      confidence: Math.min(100, recentFailures.length * 5),
      description: `${recentFailures.length} failed login attempts detected in the last 24 hours`,
      indicators: [
        `${recentFailures.length} failed attempts`,
        'Multiple IP addresses',
        'Rapid succession attempts'
      ],
      recommendedActions: [
        'Enable account lockout',
        'Review security logs',
        'Consider changing password'
      ],
      detectedAt: now
    });
  }

  // Suspicious location detection
  const locationAttempts = loginAttempts.filter(attempt => 
    attempt.location_info && attempt.location_info.suspicious
  );

  if (locationAttempts.length > 0) {
    threats.push({
      id: `location-${now.getTime()}`,
      type: 'suspicious_location',
      severity: 'medium',
      confidence: 75,
      description: 'Login attempts detected from unusual locations',
      indicators: [
        'Unusual geographic locations',
        'VPN/Proxy usage detected',
        'Location inconsistencies'
      ],
      recommendedActions: [
        'Verify recent activity',
        'Enable location alerts',
        'Review trusted devices'
      ],
      detectedAt: now
    });
  }

  // Device anomaly detection
  const untrustedDevices = devices.filter(device => !device.trusted);
  if (untrustedDevices.length > 5) {
    threats.push({
      id: `device-anomaly-${now.getTime()}`,
      type: 'device_anomaly',
      severity: 'medium',
      confidence: 60,
      description: `${untrustedDevices.length} untrusted devices associated with account`,
      indicators: [
        `${untrustedDevices.length} untrusted devices`,
        'Unusual device patterns',
        'Device fingerprint anomalies'
      ],
      recommendedActions: [
        'Review and trust known devices',
        'Revoke unknown devices',
        'Enable device notifications'
      ],
      detectedAt: now
    });
  }

  // Session security analysis
  if (sessionInfo && sessionInfo.timeRemaining < 5) {
    const recentLogins = loginAttempts.filter(attempt => 
      attempt.success && 
      new Date(attempt.created_at) > new Date(now.getTime() - 60 * 60 * 1000)
    );

    if (recentLogins.length > 3) {
      threats.push({
        id: `session-hijack-${now.getTime()}`,
        type: 'session_hijack',
        severity: 'high',
        confidence: 80,
        description: 'Multiple concurrent sessions detected',
        indicators: [
          'Multiple active sessions',
          'Rapid session creation',
          'Session from different locations'
        ],
        recommendedActions: [
          'Sign out all sessions',
          'Change password immediately',
          'Enable session monitoring'
        ],
        detectedAt: now
      });
    }
  }

  return threats;
}

/**
 * Calculate overall security metrics
 */
export function calculateSecurityMetrics(
  user: any,
  devices: any[],
  loginAttempts: any[],
  sessionInfo: any
): SecurityMetrics {
  // Password strength (would need actual password analysis)
  const passwordStrength = 75; // Mock value
  
  // Device trust score
  const trustedDevices = devices.filter(d => d.trusted).length;
  const totalDevices = devices.length;
  const deviceTrust = totalDevices > 0 ? (trustedDevices / totalDevices) * 100 : 50;
  
  // Session security
  const sessionSecurity = sessionInfo?.isActive ? 80 : 40;
  
  // Activity pattern analysis
  const analysis = analyzeLoginAttempts(loginAttempts);
  const activityPattern = Math.max(0, 100 - analysis.riskScore);
  
  // Overall score
  const overallScore = Math.round(
    (passwordStrength * 0.3 + 
     deviceTrust * 0.25 + 
     sessionSecurity * 0.25 + 
     activityPattern * 0.2)
  );
  
  // Risk assessment
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let riskFactors: string[] = [];
  
  if (overallScore >= 80) {
    riskLevel = 'low';
  } else if (overallScore >= 60) {
    riskLevel = 'medium';
    riskFactors.push('Some security improvements needed');
  } else if (overallScore >= 40) {
    riskLevel = 'high';
    riskFactors.push('Multiple security concerns detected');
  } else {
    riskLevel = 'critical';
    riskFactors.push('Immediate security action required');
  }
  
  // Additional risk factors
  if (analysis.suspiciousAttempts > 0) {
    riskFactors.push('Suspicious login activity detected');
  }
  if (devices.some(d => !d.trusted)) {
    riskFactors.push('Untrusted devices present');
  }
  if (analysis.failedAttempts > analysis.successfulAttempts) {
    riskFactors.push('High failure rate in login attempts');
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (passwordStrength < 80) {
    recommendations.push('Use a stronger password with mixed characters');
  }
  if (deviceTrust < 70) {
    recommendations.push('Review and trust your regular devices');
  }
  if (analysis.suspiciousAttempts > 0) {
    recommendations.push('Enable security notifications for unusual activity');
  }
  if (totalDevices > 5) {
    recommendations.push('Remove old or unused devices from your account');
  }
  if (!sessionInfo?.isActive) {
    recommendations.push('Keep your sessions active and secure');
  }
  
  return {
    accountSecurity: {
      score: overallScore,
      factors: {
        passwordStrength: Math.round(passwordStrength),
        deviceTrust: Math.round(deviceTrust),
        sessionSecurity: Math.round(sessionSecurity),
        activityPattern: Math.round(activityPattern)
      }
    },
    riskAssessment: {
      level: riskLevel,
      score: 100 - overallScore, // Inverse for risk
      factors: riskFactors
    },
    recommendations
  };
}

/**
 * Generate security insights based on historical data
 */
export function generateSecurityInsights(
  loginAttempts: any[],
  devices: any[],
  timeRange: number = 30 // days
): string[] {
  const insights: string[] = [];
  const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
  
  const recentAttempts = loginAttempts.filter(
    attempt => new Date(attempt.created_at) > cutoffDate
  );
  
  if (recentAttempts.length === 0) {
    insights.push('No recent login activity detected');
    return insights;
  }
  
  const analysis = analyzeLoginAttempts(recentAttempts);
  
  // Success rate insights
  if (analysis.successRate > 95) {
    insights.push('Excellent login success rate - your security setup is working well');
  } else if (analysis.successRate < 80) {
    insights.push('Lower than expected login success rate - consider reviewing failed attempts');
  }
  
  // Device insights
  if (analysis.uniqueDevices > 5) {
    insights.push(`You've used ${analysis.uniqueDevices} different devices - consider trusting regular devices`);
  }
  
  // Activity patterns
  if (analysis.peakHours.length > 0) {
    const peakHoursList = analysis.peakHours.map(h => `${h}:00`).join(', ');
    insights.push(`Most active hours: ${peakHoursList}`);
  }
  
  // Security improvements
  if (analysis.riskScore > 50) {
    insights.push('Your account shows some security risks - follow our recommendations to improve protection');
  } else if (analysis.riskScore < 20) {
    insights.push('Your account security looks great - keep following best practices');
  }
  
  // Device insights
  const trustedDevices = devices.filter(d => d.trusted).length;
  if (trustedDevices === 0) {
    insights.push('Consider trusting your regular devices to improve login experience');
  }
  
  return insights;
}

/**
 * Check if user behavior is normal based on historical patterns
 */
export function detectAnomalousActivity(
  currentActivity: any,
  historicalPattern: any
): { isAnomalous: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let anomalyScore = 0;
  
  // Time-based anomalies
  const currentHour = new Date(currentActivity.timestamp).getHours();
  if (!historicalPattern.commonHours.includes(currentHour)) {
    anomalyScore += 25;
    reasons.push('Login at unusual time');
  }
  
  // Location-based anomalies
  if (currentActivity.location && historicalPattern.commonLocations) {
    const isKnownLocation = historicalPattern.commonLocations.some(
      (loc: any) => loc.city === currentActivity.location.city
    );
    if (!isKnownLocation) {
      anomalyScore += 30;
      reasons.push('Login from new location');
    }
  }
  
  // Device-based anomalies
  if (currentActivity.deviceFingerprint && 
      !historicalPattern.knownDevices.includes(currentActivity.deviceFingerprint)) {
    anomalyScore += 35;
    reasons.push('Login from unknown device');
  }
  
  // Frequency anomalies
  if (currentActivity.frequency && currentActivity.frequency > historicalPattern.avgFrequency * 3) {
    anomalyScore += 20;
    reasons.push('Unusually high login frequency');
  }
  
  return {
    isAnomalous: anomalyScore > 50,
    confidence: Math.min(100, anomalyScore),
    reasons
  };
}

/**
 * Format security score for display
 */
export function formatSecurityScore(score: number): {
  level: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      level: 'Excellent',
      color: '#22C55E',
      description: 'Your account is very secure'
    };
  } else if (score >= 75) {
    return {
      level: 'Good',
      color: '#84CC16',
      description: 'Your account is well protected'
    };
  } else if (score >= 60) {
    return {
      level: 'Fair',
      color: '#EAB308',
      description: 'Some security improvements recommended'
    };
  } else if (score >= 40) {
    return {
      level: 'Poor',
      color: '#F97316',
      description: 'Multiple security issues need attention'
    };
  } else {
    return {
      level: 'Critical',
      color: '#EF4444',
      description: 'Immediate security action required'
    };
  }
}

