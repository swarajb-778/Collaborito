// Fallback data for when database sample data is missing
// This provides the app with basic functionality during development/testing

export const fallbackInterests = [
  { id: 'temp-1', name: 'Technology', category: 'Technology' },
  { id: 'temp-2', name: 'Business', category: 'Business' },
  { id: 'temp-3', name: 'Art & Design', category: 'Creative' },
  { id: 'temp-4', name: 'Health & Fitness', category: 'Health' },
  { id: 'temp-5', name: 'Education', category: 'Education' },
  { id: 'temp-6', name: 'Entertainment', category: 'Entertainment' },
  { id: 'temp-7', name: 'Science', category: 'Science' },
  { id: 'temp-8', name: 'Social Impact', category: 'Social' },
  { id: 'temp-9', name: 'Travel', category: 'Lifestyle' },
  { id: 'temp-10', name: 'Other', category: 'Other' }
];

export const fallbackSkills = [
  { id: 'temp-1', name: 'Software Development', category: 'Technology' },
  { id: 'temp-2', name: 'Business Development', category: 'Business' },
  { id: 'temp-3', name: 'Graphic Design', category: 'Creative' },
  { id: 'temp-4', name: 'Marketing', category: 'Business' },
  { id: 'temp-5', name: 'Project Management', category: 'Business' },
  { id: 'temp-6', name: 'Data Analysis', category: 'Technology' },
  { id: 'temp-7', name: 'UI/UX Design', category: 'Creative' },
  { id: 'temp-8', name: 'Sales', category: 'Business' },
  { id: 'temp-9', name: 'Research', category: 'Science' },
  { id: 'temp-10', name: 'Other', category: 'Other' }
];

/**
 * Get interests from database or fallback data
 */
export async function getInterestsWithFallback(supabase: any) {
  try {
    console.log('🔍 Fetching interests from database...');
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('name');
    
    if (error) {
      console.warn('Error fetching interests from database:', error.message);
      console.log('📋 Using fallback interests data');
      return fallbackInterests;
    }
    
    if (!data || data.length === 0) {
      console.log('📋 No interests found in database, using fallback data');
      return fallbackInterests;
    }
    
    console.log(`✅ Loaded ${data.length} interests from database`);
    return data;
    
  } catch (error) {
    console.warn('Failed to fetch interests:', error);
    console.log('📋 Using fallback interests data');
    return fallbackInterests;
  }
}

/**
 * Get skills from database or fallback data
 */
export async function getSkillsWithFallback(supabase: any) {
  try {
    console.log('🔍 Fetching skills from database...');
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');
    
    if (error) {
      console.warn('Error fetching skills from database:', error.message);
      console.log('🛠️ Using fallback skills data');
      return fallbackSkills;
    }
    
    if (!data || data.length === 0) {
      console.log('🛠️ No skills found in database, using fallback data');
      return fallbackSkills;
    }
    
    console.log(`✅ Loaded ${data.length} skills from database`);
    return data;
    
  } catch (error) {
    console.warn('Failed to fetch skills:', error);
    console.log('🛠️ Using fallback skills data');
    return fallbackSkills;
  }
}

/**
 * Check if we're using fallback data (for UI notifications)
 */
export function isFallbackData(data: any[]) {
  return data.some(item => item.id?.toString().startsWith('temp-'));
} 