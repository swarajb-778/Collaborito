-- Device Notifications Migration
-- Implements new device login notifications and alerts

-- Create device_notifications table for tracking new device logins
CREATE TABLE IF NOT EXISTS device_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  location_info JSONB,
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_trusted BOOLEAN DEFAULT FALSE,
  action_taken TEXT CHECK (action_taken IN ('trusted', 'blocked', 'dismissed')),
  action_taken_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_notifications_user_id ON device_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_device_notifications_device_fingerprint ON device_notifications(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_notifications_created_at ON device_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_device_notifications_action_taken ON device_notifications(action_taken);
CREATE INDEX IF NOT EXISTS idx_device_notifications_pending ON device_notifications(user_id, action_taken, is_dismissed) WHERE action_taken IS NULL AND is_dismissed = FALSE;

-- Add trigger for updated_at column
CREATE TRIGGER update_device_notifications_updated_at
  BEFORE UPDATE ON device_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE device_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_notifications
CREATE POLICY "Users can view their own device notifications" ON device_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert device notifications" ON device_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own device notifications" ON device_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can delete old device notifications" ON device_notifications
  FOR DELETE USING (true);

-- Function to automatically create device notifications on new device logins
CREATE OR REPLACE FUNCTION check_new_device_login(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_device_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_location_info JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  device_exists BOOLEAN;
  notification_exists BOOLEAN;
BEGIN
  -- Check if device is already trusted
  SELECT EXISTS(
    SELECT 1 FROM user_devices 
    WHERE user_id = p_user_id 
    AND device_fingerprint = p_device_fingerprint 
    AND trusted = TRUE
  ) INTO device_exists;
  
  -- If device is trusted, no notification needed
  IF device_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Check if notification already exists for this device in last 24 hours
  SELECT EXISTS(
    SELECT 1 FROM device_notifications 
    WHERE user_id = p_user_id 
    AND device_fingerprint = p_device_fingerprint 
    AND created_at > NOW() - INTERVAL '24 hours'
  ) INTO notification_exists;
  
  -- If recent notification exists, don't create another
  IF notification_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Create new device notification
  INSERT INTO device_notifications (
    user_id,
    device_fingerprint,
    device_name,
    device_info,
    ip_address,
    location_info
  ) VALUES (
    p_user_id,
    p_device_fingerprint,
    COALESCE(p_device_info->>'device_name', p_device_info->>'name', 'Unknown Device'),
    p_device_info,
    p_ip_address,
    p_location_info
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old device notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_device_notifications()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  DELETE FROM device_notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
