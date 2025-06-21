import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ProfileData {
  firstName: string;
  lastName: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
}

interface InterestsData {
  interestIds: string[];
}

interface GoalsData {
  goalType: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: any;
}

interface ProjectDetailsData {
  name: string;
  description: string;
  tags: string[];
}

interface SkillsData {
  skills: Array<{
    skillId: string;
    isOffering: boolean;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { step, data, userId } = await req.json();

    if (!step || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: step and userId' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing onboarding step: ${step} for user: ${userId}`);

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: any = { success: false };

    switch (step) {
      case 'profile':
        result = await handleProfileStep(supabase, userId, data as ProfileData);
        break;
      case 'interests':
        result = await handleInterestsStep(supabase, userId, data as InterestsData);
        break;
      case 'goals':
        result = await handleGoalsStep(supabase, userId, data as GoalsData);
        break;
      case 'project_details':
        result = await handleProjectDetailsStep(supabase, userId, data as ProjectDetailsData);
        break;
      case 'skills':
        result = await handleSkillsStep(supabase, userId, data as SkillsData);
        break;
      case 'get_progress':
        result = await getOnboardingProgress(supabase, userId);
        break;
      case 'get_interests':
        result = await getAvailableInterests(supabase);
        break;
      case 'get_skills':
        result = await getAvailableSkills(supabase);
        break;
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown step: ${step}` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in onboarding handler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleProfileStep(supabase: any, userId: string, profileData: ProfileData) {
  try {
    console.log('Handling profile step:', profileData);

    // Validate input
    if (!profileData.firstName || !profileData.lastName) {
      return { success: false, error: 'First name and last name are required' };
    }

    // Upsert profile data
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        location: profileData.location,
        job_title: profileData.jobTitle,
        bio: profileData.bio,
        onboarding_step: 'interests',
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Profile upsert error:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: data[0],
      nextStep: 'interests'
    };

  } catch (error) {
    console.error('Profile step error:', error);
    return { success: false, error: error.message };
  }
}

async function handleInterestsStep(supabase: any, userId: string, interestsData: InterestsData) {
  try {
    console.log('Handling interests step:', interestsData);

    if (!interestsData.interestIds || interestsData.interestIds.length === 0) {
      return { success: false, error: 'At least one interest must be selected' };
    }

    // Delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);

    // Insert new interests
    const userInterests = interestsData.interestIds.map(interestId => ({
      user_id: userId,
      interest_id: interestId
    }));

    const { error: insertError } = await supabase
      .from('user_interests')
      .insert(userInterests);

    if (insertError) {
      console.error('Interests insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    // Update onboarding step
    await supabase
      .from('profiles')
      .update({ 
        onboarding_step: 'goals',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { 
      success: true,
      nextStep: 'goals'
    };

  } catch (error) {
    console.error('Interests step error:', error);
    return { success: false, error: error.message };
  }
}

async function handleGoalsStep(supabase: any, userId: string, goalsData: GoalsData) {
  try {
    console.log('Handling goals step:', goalsData);

    const validGoalTypes = ['find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas'];
    if (!goalsData.goalType || !validGoalTypes.includes(goalsData.goalType)) {
      return { success: false, error: 'Valid goal type is required' };
    }

    // Upsert goals data
    const { data, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        goal_type: goalsData.goalType,
        details: goalsData.details,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Goals upsert error:', error);
      return { success: false, error: error.message };
    }

    // Determine next step based on goal type
    const nextStep = goalsData.goalType === 'find_cofounder' ? 'project_details' : 'skills';
    
    // Update onboarding step
    await supabase
      .from('profiles')
      .update({ 
        onboarding_step: nextStep,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { 
      success: true,
      data: data[0],
      nextStep
    };

  } catch (error) {
    console.error('Goals step error:', error);
    return { success: false, error: error.message };
  }
}

async function handleProjectDetailsStep(supabase: any, userId: string, projectData: ProjectDetailsData) {
  try {
    console.log('Handling project details step:', projectData);

    if (!projectData.name || !projectData.description) {
      return { success: false, error: 'Project name and description are required' };
    }

    // Insert project data
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        tags: projectData.tags,
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Project insert error:', error);
      return { success: false, error: error.message };
    }

    // Update onboarding step
    await supabase
      .from('profiles')
      .update({ 
        onboarding_step: 'skills',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { 
      success: true,
      data: data[0],
      nextStep: 'skills'
    };

  } catch (error) {
    console.error('Project details step error:', error);
    return { success: false, error: error.message };
  }
}

async function handleSkillsStep(supabase: any, userId: string, skillsData: SkillsData) {
  try {
    console.log('Handling skills step:', skillsData);

    if (!skillsData.skills || skillsData.skills.length === 0) {
      return { success: false, error: 'At least one skill must be selected' };
    }

    // Delete existing skills
    await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId);

    // Insert new skills
    const userSkills = skillsData.skills.map(skill => ({
      user_id: userId,
      skill_id: skill.skillId,
      is_offering: skill.isOffering,
      proficiency: skill.proficiency
    }));

    const { error: insertError } = await supabase
      .from('user_skills')
      .insert(userSkills);

    if (insertError) {
      console.error('Skills insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    // Complete onboarding
    await supabase
      .from('profiles')
      .update({ 
        onboarding_step: 'completed',
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { 
      success: true,
      completed: true
    };

  } catch (error) {
    console.error('Skills step error:', error);
    return { success: false, error: error.message };
  }
}

async function getOnboardingProgress(supabase: any, userId: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return {
      success: true,
      currentStep: profile?.onboarding_step || 'profile',
      isComplete: profile?.onboarding_completed || false,
      profileData: {
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        location: profile?.location,
        jobTitle: profile?.job_title,
        bio: profile?.bio
      }
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAvailableInterests(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAvailableSkills(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    return { success: false, error: error.message };
  }
} 