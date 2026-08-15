import type { Resource } from '@prisma/client';
import type { StructuredRequirement } from './ai';

export interface MatchResult {
  resource: Resource & { department: { name: string; color: string; location: string } };
  matchScore: number;
  quantityMatched: number;
  availabilityScore: number;
  compatibilityScore: number;
  quantityScore: number;
  locationScore: number;
  conditionScore: number;
  costBenefitScore: number;
  reason: string;
  isBundle: boolean;
  isAlternative?: boolean;
  alternativeFor?: string;
  requirementKey?: string;
  matchId?: string;
}

export interface RescuePlan {
  matches: MatchResult[];
  totalRequirementMet: number;
  estimatedSavings: number;
  estimatedCO2Avoided: number;
  requirementFulfillmentPct: number;
  resourceBundles: BundleResult[];
  alternatives: AlternativeSuggestion[];
  summary: string;
}

export interface BundleResult {
  resourceType: string;
  needed: number;
  found: number;
  sources: Array<{ departmentName: string; quantity: number; resourceName: string }>;
  covered: boolean;
}

export interface AlternativeSuggestion {
  originalRequested: string;
  suggestedResource: string;
  departmentName: string;
  availableQuantity: number;
  reason: string;
}

const WEIGHTS = {
  availability: 0.30,
  compatibility: 0.25,
  quantity: 0.15,
  location: 0.10,
  condition: 0.10,
  costBenefit: 0.10,
};

function conditionScore(condition: string): number {
  const scores: Record<string, number> = {
    Excellent: 100,
    Good: 85,
    Fair: 60,
    Poor: 30,
  };
  return scores[condition] ?? 50;
}

function availabilityScore(resource: Resource, neededFrom: Date, neededUntil: Date): number {
  if (resource.status !== 'AVAILABLE') return 0;
  const avFrom = new Date(resource.availableFrom);
  const avUntil = resource.availableUntil ? new Date(resource.availableUntil) : new Date('2099-01-01');
  if (avFrom <= neededFrom && avUntil >= neededUntil) return 100;
  if (avFrom <= neededUntil && avUntil >= neededFrom) return 75;
  return 0;
}

function quantityScore(available: number, needed: number): number {
  if (available >= needed) return 100;
  if (available === 0) return 0;
  return Math.round((available / needed) * 100);
}

function compatibilityScore(resource: Resource, itemKey: string, req: StructuredRequirement): number {
  const category = (resource.category || '').toLowerCase();
  const tags = (resource.tags || '').toLowerCase();
  const name = (resource.name || '').toLowerCase();
  const desc = (resource.description || '').toLowerCase();
  const itemLower = (itemKey || '').toLowerCase();

  let score = 0;

  if (name.includes(itemLower) || tags.includes(itemLower)) {
    score = 95;
  } else if (itemLower.includes('laptop') && (name.includes('laptop') || tags.includes('laptop'))) {
    score = 95;
  } else if (itemLower.includes('projector') && (name.includes('projector') || tags.includes('projector'))) {
    score = 95;
  } else if (itemLower.includes('chair') && (name.includes('chair') || tags.includes('chair'))) {
    score = 95;
  } else if (itemLower.includes('table') && (name.includes('table') || name.includes('desk') || tags.includes('table'))) {
    score = 95;
  } else if (itemLower.includes('mic') && (name.includes('mic') || tags.includes('mic'))) {
    score = 95;
  } else if (itemLower.includes('camera') && (name.includes('camera') || tags.includes('camera'))) {
    score = 95;
  } else if (itemLower.includes('arduino') && (name.includes('arduino') || tags.includes('arduino'))) {
    score = 98;
  } else if ((itemLower.includes('room') || itemLower.includes('classroom') || itemLower.includes('hall') || itemLower.includes('space')) &&
             (category === 'space' || tags.includes('room') || tags.includes('classroom') || tags.includes('hall') || name.includes('lab') || name.includes('hall') || name.includes('studio'))) {
    score = 95;
  } else {
    const itemWords = itemLower.split(/\s+/).filter(w => w.length > 2);
    const matchesCount = itemWords.filter(w => name.includes(w) || tags.includes(w) || desc.includes(w)).length;
    if (matchesCount > 0) {
      score = Math.min(60 + matchesCount * 15, 90);
    }
  }

  if (req.purpose) {
    const purpose = req.purpose.toLowerCase();
    if (tags.includes(purpose) || desc.includes(purpose)) {
      score = Math.min(score + 5, 100);
    }
  }

  return score;
}

function costBenefitScore(estimatedValue: number): number {
  if (estimatedValue >= 50000) return 100;
  if (estimatedValue >= 20000) return 85;
  if (estimatedValue >= 10000) return 70;
  if (estimatedValue >= 5000) return 55;
  if (estimatedValue >= 1000) return 40;
  return 25;
}

export function calculateMatchScore(
  resource: Resource & { department: { name: string; color: string; location: string } },
  req: StructuredRequirement,
  itemKey: string,
  needed: number,
  neededFrom: Date,
  neededUntil: Date
): MatchResult {
  const avScore = availabilityScore(resource, neededFrom, neededUntil);
  const compScore = compatibilityScore(resource, itemKey, req);
  const qtyScore = quantityScore(resource.quantity, needed);
  const locScore = 85;
  const condScore = conditionScore(resource.condition);
  const cbScore = costBenefitScore(resource.estimatedValue);

  const total = Math.round(
    avScore * WEIGHTS.availability +
    compScore * WEIGHTS.compatibility +
    qtyScore * WEIGHTS.quantity +
    locScore * WEIGHTS.location +
    condScore * WEIGHTS.condition +
    cbScore * WEIGHTS.costBenefit
  );

  const quantityMatched = Math.min(resource.quantity, needed);

  const reasons = [];
  if (compScore >= 90) reasons.push('high specification compatibility');
  if (avScore === 100) reasons.push('fully available during requested period');
  if (qtyScore === 100) reasons.push('sufficient quantity');
  else if (qtyScore > 0) reasons.push(`partial quantity (${resource.quantity}/${needed} available)`);
  if (condScore >= 85) reasons.push(`${resource.condition.toLowerCase()} condition`);

  return {
    resource,
    matchScore: total,
    quantityMatched,
    availabilityScore: avScore,
    compatibilityScore: compScore,
    quantityScore: qtyScore,
    locationScore: locScore,
    conditionScore: condScore,
    costBenefitScore: cbScore,
    reason: `${resource.name} matches with ${reasons.join(', ')}.`,
    isBundle: false,
    requirementKey: itemKey,
  };
}

export function buildRescuePlan(
  matches: MatchResult[],
  req: StructuredRequirement,
  estimatedPurchaseCost: number
): RescuePlan {
  const bundles: BundleResult[] = [];
  const alternatives: AlternativeSuggestion[] = [];
  let totalSavings = 0;
  let totalCO2 = 0;

  const requestedItems: Array<{ key: string; label: string; needed: number }> = [];

  const standardKeys: Array<{ key: keyof StructuredRequirement; label: string }> = [
    { key: 'laptops', label: 'Laptops' },
    { key: 'projectors', label: 'Projectors' },
    { key: 'chairs', label: 'Chairs' },
    { key: 'tables', label: 'Tables' },
    { key: 'microphones', label: 'Microphones' },
    { key: 'cameras', label: 'Cameras' },
    { key: 'arduinoKits', label: 'Arduino Kits' },
    { key: 'rooms', label: 'Rooms' },
    { key: 'classrooms', label: 'Classrooms' },
  ];

  for (const { key, label } of standardKeys) {
    const qty = (req as any)[key];
    if (typeof qty === 'number' && qty > 0) {
      requestedItems.push({ key: key as string, label, needed: qty });
    }
  }

  if (req.otherItems && Array.isArray(req.otherItems)) {
    for (const item of req.otherItems) {
      if (item.name && item.quantity > 0) {
        requestedItems.push({ key: item.name, label: item.name, needed: item.quantity });
      }
    }
  }

  for (const { key, label, needed } of requestedItems) {
    const typeMatches = matches.filter(m => {
      if (m.requirementKey === key || m.requirementKey === label || m.requirementKey?.toLowerCase() === key.toLowerCase()) return true;

      const rName = (m.resource?.name || '').toLowerCase();
      const rTags = (m.resource?.tags || '').toLowerCase();
      const rCat = (m.resource?.category || '').toLowerCase();
      const rDesc = (m.resource?.description || '').toLowerCase();
      const keyLower = key.toLowerCase();

      if (key === 'laptops' && (rName.includes('laptop') || rTags.includes('laptop'))) return true;
      if (key === 'projectors' && (rName.includes('projector') || rTags.includes('projector'))) return true;
      if (key === 'chairs' && (rName.includes('chair') || rTags.includes('chair'))) return true;
      if (key === 'tables' && (rName.includes('table') || rName.includes('desk') || rTags.includes('table'))) return true;
      if (key === 'microphones' && (rName.includes('mic') || rTags.includes('mic'))) return true;
      if (key === 'cameras' && (rName.includes('camera') || rTags.includes('camera'))) return true;
      if (key === 'arduinoKits' && (rName.includes('arduino') || rTags.includes('arduino'))) return true;
      if ((key === 'rooms' || key === 'classrooms') &&
          (rCat === 'space' || rTags.includes('room') || rTags.includes('classroom') || rName.includes('lab') || rName.includes('hall') || rName.includes('studio'))) {
        return true;
      }

      // Fuzzy word matching for custom items (e.g. "vr headsets", "studio light panels", "podcast rigs", "oscilloscopes")
      const words = keyLower.split(/\s+/).filter(w => w.length >= 2 && !['and', 'the', 'for', 'with', 'set', 'kit'].includes(w));
      if (words.length > 0 && words.some(w => rName.includes(w) || rTags.includes(w) || rDesc.includes(w))) {
        return true;
      }

      return false;
    });

    const found = typeMatches.reduce((sum, m) => sum + m.quantityMatched, 0);
    const sources = typeMatches.map(m => ({
      departmentName: m.resource.department?.name || 'Department',
      quantity: m.quantityMatched,
      resourceName: m.resource.name,
    }));

    bundles.push({
      resourceType: label,
      needed,
      found,
      sources,
      covered: found >= needed,
    });

    if (typeMatches.length > 0) {
      const savedForType = typeMatches.reduce((sum, m) => sum + (m.resource.estimatedValue * m.quantityMatched), 0);
      totalSavings += savedForType;
      totalCO2 += savedForType * 0.005;
    } else {
      const altMatch = matches.find(m => m.isAlternative);
      if (altMatch) {
        alternatives.push({
          originalRequested: label,
          suggestedResource: altMatch.resource.name,
          departmentName: altMatch.resource.department?.name || 'Department',
          availableQuantity: altMatch.resource.quantity,
          reason: `Suggested as a functional alternative for ${label}`,
        });
      }
    }
  }

  const fulfilledCount = bundles.filter(b => b.covered).length;
  const totalCount = bundles.length;
  const fulfillmentPct = totalCount > 0 ? Math.round((fulfilledCount / totalCount) * 100) : 100;

  const finalSavings = estimatedPurchaseCost > 0 ? Math.min(totalSavings || estimatedPurchaseCost, estimatedPurchaseCost) : totalSavings;

  return {
    matches,
    totalRequirementMet: fulfilledCount,
    estimatedSavings: finalSavings,
    estimatedCO2Avoided: Math.round(totalCO2),
    requirementFulfillmentPct: fulfillmentPct,
    resourceBundles: bundles,
    alternatives,
    summary: fulfillmentPct === 100
      ? `RESCUE found existing resources satisfying 100% of your requirement. No new purchase necessary.`
      : `RESCUE found resources covering ${fulfillmentPct}% of your requirement. Multi-department sharing covers majority of assets.`,
  };
}
