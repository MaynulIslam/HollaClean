const { toISO } = require('./db');

// `withImages: false` omits the (potentially large, base64) photos — used for
// list/feed endpoints so payloads stay small. Detail endpoints keep them.
function serializeRequest(r, { withImages = true } = {}) {
  if (!r) return r;
  const homeowner = r.homeowner || {};
  const cleaner = r.cleaner || null;
  return {
    id: r.id,
    homeownerId: r.homeownerId,
    homeownerName: homeowner.name || '',
    homeownerPhone: homeowner.phone || '',
    homeownerEmail: homeowner.email || '',

    serviceType: r.serviceType,
    date: r.date,
    time: r.time,
    hours: r.hours,
    address: r.address,
    instructions: r.instructions || '',
    images: withImages ? (r.images || []) : [],
    imageCount: Array.isArray(r.images) ? r.images.length : 0,
    roomImages: withImages ? (r.roomImages || undefined) : undefined,

    status: r.status,

    acceptedBy: r.cleanerId || null,
    cleanerId: r.cleanerId || undefined,
    cleanerName: cleaner ? cleaner.name : null,
    cleanerPhone: cleaner ? cleaner.phone || null : null,
    cleanerEmail: cleaner ? cleaner.email || null : null,

    hourlyRate: r.hourlyRate,
    acceptedAt: toISO(r.acceptedAt),
    completedAt: toISO(r.completedAt),

    basePrice: r.basePrice != null ? r.basePrice : undefined,
    totalAmount: r.totalAmount,
    taxAmount: r.taxAmount,
    taxRate: r.taxRate,
    platformCommission: r.platformCommission,
    cleanerPayout: r.cleanerPayout,
    paymentStatus: r.paymentStatus,
    paymentIntentId: r.paymentIntentId || undefined,
    paidAt: toISO(r.paidAt) || undefined,

    payoutStatus: r.payoutStatus || undefined,
    payoutDisbursedAt: toISO(r.payoutDisbursedAt) || undefined,
    payoutAmount: r.payoutAmount != null ? r.payoutAmount : undefined,

    squareFootage: r.squareFootage || undefined,
    floorType: r.floorType || undefined,
    numberOfBedrooms: r.numberOfBedrooms || undefined,
    numberOfBathrooms: r.numberOfBathrooms || undefined,
    numberOfKitchens: r.numberOfKitchens || undefined,
    numberOfLivingRooms: r.numberOfLivingRooms || undefined,
    numberOfOtherRooms: r.numberOfOtherRooms || undefined,
    hasPets: r.hasPets != null ? r.hasPets : undefined,

    locationApprovalStatus: r.locationApprovalStatus || undefined,
    locationApprovalRequestedAt: toISO(r.locationApprovalRequestedAt) || undefined,
    cleanerDistanceAtStart: r.cleanerDistanceAtStart != null ? r.cleanerDistanceAtStart : undefined,

    createdAt: toISO(r.createdAt) || new Date().toISOString(),
  };
}

module.exports = { serializeRequest };
