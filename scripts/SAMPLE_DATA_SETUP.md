# Sample Data Setup Guide

## Quick Fix for Missing Sample Data

Your Supabase tables are created but missing sample data. Here's how to fix it quickly:

### Option 1: Quick SQL Insert (Recommended)

1. **Go to your Supabase Dashboard**
   - Open [supabase.com](https://supabase.com)
   - Navigate to your project: `ekydublgvsoaaepdhtzc`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL** (insert all interests):
```sql
INSERT INTO interests (name, category) VALUES
  ('Art', 'Creative'),
  ('Artificial Intelligence & Machine Learning', 'Technology'),
  ('Biotechnology', 'Science'),
  ('Business', 'Business'),
  ('Books', 'Entertainment'),
  ('Climate Change', 'Environmental'),
  ('Civic Engagement', 'Social'),
  ('Dancing', 'Entertainment'),
  ('Data Science', 'Technology'),
  ('Education', 'Education'),
  ('Entrepreneurship', 'Business'),
  ('Fashion', 'Creative'),
  ('Fitness', 'Health'),
  ('Food', 'Lifestyle'),
  ('Gaming', 'Entertainment'),
  ('Health & Wellness', 'Health'),
  ('Investing & Finance', 'Business'),
  ('Marketing', 'Business'),
  ('Movies', 'Entertainment'),
  ('Music', 'Entertainment'),
  ('Parenting', 'Lifestyle'),
  ('Pets', 'Lifestyle'),
  ('Product Design', 'Creative'),
  ('Reading', 'Entertainment'),
  ('Real Estate', 'Business'),
  ('Robotics', 'Technology'),
  ('Science & Tech', 'Technology'),
  ('Social Impact', 'Social'),
  ('Sports', 'Entertainment'),
  ('Travel', 'Lifestyle'),
  ('Writing', 'Creative'),
  ('Other', 'Other')
ON CONFLICT (name) DO NOTHING;
```

4. **Run the query** by clicking the "Run" button

5. **Insert skills** with this SQL:
```sql
INSERT INTO skills (name, category) VALUES
  ('Accounting', 'Business'),
  ('Artificial Intelligence & Machine Learning', 'Technology'),
  ('Biotechnology', 'Science'),
  ('Business Development', 'Business'),
  ('Content Creation', 'Marketing'),
  ('Counseling & Therapy', 'Health'),
  ('Data Analysis', 'Technology'),
  ('DevOps', 'Technology'),
  ('Finance', 'Business'),
  ('Fundraising', 'Business'),
  ('Graphic Design', 'Creative'),
  ('Legal', 'Professional'),
  ('Manufacturing', 'Industrial'),
  ('Marketing', 'Business'),
  ('Policy', 'Government'),
  ('Product Management', 'Business'),
  ('Project Management', 'Business'),
  ('Public Relations', 'Marketing'),
  ('Research', 'Science'),
  ('Sales', 'Business'),
  ('Software Development (Backend)', 'Technology'),
  ('Software Development (Frontend)', 'Technology'),
  ('UI/UX Design', 'Creative'),
  ('Other', 'Other')
ON CONFLICT (name) DO NOTHING;
```

6. **Verify the data** by running:
```sql
SELECT COUNT(*) as interests_count FROM interests;
SELECT COUNT(*) as skills_count FROM skills;
```

### Option 2: Manual Entry (if SQL doesn't work)

If the SQL approach doesn't work, you can manually add a few basic entries:

1. Go to "Table Editor" in your Supabase dashboard
2. Click on the "interests" table
3. Click "Insert" → "Insert row"
4. Add these basic interests:
   - Technology, Business, Health, Education, Entertainment

5. Repeat for the "skills" table:
   - Software Development, Marketing, Design, Sales, Project Management

### Verification

After adding the data, run the status check:
```bash
npm run status-check
```

You should see:
- ✅ Sample data: POPULATED
- 📊 Interests: 32, Skills: 24 (or your manually added count)

### If Sample Data Still Fails

Don't worry! The app now has **fallback data** built-in. The onboarding will work with basic options even if the database is empty.

### What This Fixes

- ✅ Onboarding interest selection will work
- ✅ Onboarding skill selection will work  
- ✅ Users can complete the full onboarding flow
- ✅ No more "Sample data missing" warnings

### Test Your Fix

1. Run `npm run status-check`
2. Start the app with `npx expo start`
3. Try creating a new account
4. Go through the onboarding flow

The interest and skill selection screens should now show the data you added! 