import { addXP } from "./gamification-utils";

// Define XP rewards for each profile field
const FIELD_XP_REWARDS: Record<string, number> = {
  // Basic profile fields
  full_name: 5,
  last_name: 5,
  bio: 10,
  phone: 5,
  country_code: 3,
  location: 5,
  profile_picture_url: 10,
  resume_url: 15,
  
  // Professional fields
  specialisation: 10,
  experience: 15,
  skills: 10,
  education: 15,
  experience_json: 15,
  education_json: 15,
  
  // Social media fields
  instagram_url: 5,
  facebook_url: 5,
  linkedin_url: 5,
  
  // Work status
  is_open_to_work: 5,
  
  // Business account fields
  business_name: 10,
  logo_url: 10,
  country: 5,
  state: 5,
  city: 5,
  pincode: 3,
  gst_number: 10,
  gst_document_url: 15,
  
  // Individual account fields
  workplace_type: 5,
  workplace_name: 10,
  
  // Onboarding fields
  specialities: 10,
  products: 15,
};

export async function awardProfileFieldXP(
  db: Env["DB"],
  userId: string,
  fieldName: string,
  fieldValue: any
): Promise<{ awarded: boolean; xp: number }> {
  // Check if field has a meaningful value
  if (!hasValue(fieldValue)) {
    return { awarded: false, xp: 0 };
  }
  
  // Check if XP already awarded for this field
  const existing = await db.prepare(
    "SELECT id FROM profile_field_xp WHERE user_id = ? AND field_name = ?"
  ).bind(userId, fieldName).first();
  
  if (existing) {
    return { awarded: false, xp: 0 };
  }
  
  // Get XP reward for this field
  const xpAmount = FIELD_XP_REWARDS[fieldName] || 5;
  
  // Record that XP was awarded
  await db.prepare(
    "INSERT INTO profile_field_xp (user_id, field_name, xp_awarded) VALUES (?, ?, ?)"
  ).bind(userId, fieldName, xpAmount).run();
  
  // Award XP
  await addXP(db, userId, xpAmount, `profile_field_${fieldName}`, { field_name: fieldName });
  
  return { awarded: true, xp: xpAmount };
}

export async function checkProfileFieldsAndAwardXP(
  db: Env["DB"],
  userId: string,
  updatedFields: Record<string, any>
): Promise<{ totalXP: number; fieldsAwarded: string[] }> {
  let totalXP = 0;
  const fieldsAwarded: string[] = [];
  
  for (const [fieldName, fieldValue] of Object.entries(updatedFields)) {
    // Skip certain fields
    if (fieldName === 'updated_at' || fieldName === 'user_id') {
      continue;
    }
    
    const result = await awardProfileFieldXP(db, userId, fieldName, fieldValue);
    if (result.awarded) {
      totalXP += result.xp;
      fieldsAwarded.push(fieldName);
    }
  }
  
  return { totalXP, fieldsAwarded };
}

export async function getProfileCompletionStatus(
  db: Env["DB"],
  userId: string
): Promise<{
  completionPercentage: number;
  totalFields: number;
  filledFields: number;
  missingFields: string[];
  potentialXP: number;
}> {
  // Get user profile
  const profile = await db.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first();
  
  if (!profile) {
    return {
      completionPercentage: 0,
      totalFields: 0,
      filledFields: 0,
      missingFields: [],
      potentialXP: 0,
    };
  }
  
  const accountType = profile.account_type as string;
  
  // Get awarded fields
  const { results: awardedFields } = await db.prepare(
    "SELECT field_name FROM profile_field_xp WHERE user_id = ?"
  ).bind(userId).all();
  
  const awarded = new Set(awardedFields.map((f: any) => f.field_name));
  
  // Determine which fields to check based on account type
  const fieldsToCheck = getFieldsForAccountType(accountType);
  
  let filledFields = 0;
  let potentialXP = 0;
  const missingFields: string[] = [];
  
  for (const fieldName of fieldsToCheck) {
    if (awarded.has(fieldName)) {
      filledFields++;
    } else {
      const fieldValue = (profile as any)[fieldName];
      if (hasValue(fieldValue)) {
        // Field is filled but XP not yet awarded
        filledFields++;
      } else {
        // Field is empty
        missingFields.push(fieldName);
        potentialXP += FIELD_XP_REWARDS[fieldName] || 5;
      }
    }
  }
  
  // Check specialities and products
  const { results: specialities } = await db.prepare(
    "SELECT COUNT(*) as count FROM user_specialities WHERE user_id = ?"
  ).bind(userId).all();
  
  const hasSpecialities = specialities[0] && (specialities[0] as any).count > 0;
  
  if (awarded.has('specialities') || hasSpecialities) {
    filledFields++;
  } else {
    missingFields.push('specialities');
    potentialXP += FIELD_XP_REWARDS.specialities;
  }
  
  const { results: products } = await db.prepare(
    "SELECT COUNT(*) as count FROM user_products WHERE user_id = ?"
  ).bind(userId).all();
  
  const hasProducts = products[0] && (products[0] as any).count > 0;
  
  if (awarded.has('products') || hasProducts) {
    filledFields++;
  } else {
    missingFields.push('products');
    potentialXP += FIELD_XP_REWARDS.products;
  }
  
  const totalFields = fieldsToCheck.length + 2; // +2 for specialities and products
  const completionPercentage = Math.round((filledFields / totalFields) * 100);
  
  return {
    completionPercentage,
    totalFields,
    filledFields,
    missingFields,
    potentialXP,
  };
}

function hasValue(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return false;
  }
  
  return true;
}

function getFieldsForAccountType(accountType: string): string[] {
  const commonFields = [
    'full_name',
    'last_name',
    'bio',
    'phone',
    'location',
    'profile_picture_url',
    'experience',
    'skills',
    'education',
    'instagram_url',
    'facebook_url',
    'linkedin_url',
  ];
  
  if (accountType === 'business') {
    return [
      ...commonFields,
      'business_name',
      'logo_url',
      'country',
      'state',
      'city',
      'pincode',
      'gst_number',
      'gst_document_url',
    ];
  } else if (accountType === 'individual') {
    return [
      ...commonFields,
      'workplace_type',
      'workplace_name',
    ];
  } else if (accountType === 'freelancer') {
    return [
      ...commonFields,
      'country',
      'state',
      'city',
      'pincode',
      'resume_url',
    ];
  }
  
  return commonFields;
}
