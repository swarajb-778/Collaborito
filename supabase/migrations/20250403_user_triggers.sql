-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle invitations when a new user signs up
CREATE OR REPLACE FUNCTION handle_user_invitations() 
RETURNS TRIGGER AS $$
DECLARE
  invitation RECORD;
BEGIN
  -- Find any pending invitations for this user's email
  FOR invitation IN 
    SELECT * FROM public.invitations 
    WHERE invitee_email = NEW.email 
    AND status = 'pending'
  LOOP
    -- Add the user to the project
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (invitation.project_id, NEW.id, invitation.role);
    
    -- Update invitation status
    UPDATE public.invitations 
    SET status = 'accepted' 
    WHERE id = invitation.id;
    
    -- Create notification for project owner
    INSERT INTO public.notifications (
      user_id, 
      type, 
      content, 
      related_project_id
    )
    VALUES (
      invitation.inviter_id, 
      'member_joined', 
      json_build_object(
        'user_id', NEW.id,
        'project_id', invitation.project_id,
        'message', 'A new member has joined your project'
      ),
      invitation.project_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle invitations when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created_handle_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_user_invitations(); 