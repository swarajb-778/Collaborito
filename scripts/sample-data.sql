-- Sample data for interests and skills tables
-- Run this in your Supabase SQL editor to populate the database

-- Insert interests
INSERT INTO interests (name, category) VALUES
('Artificial Intelligence', 'Technology'),
('Machine Learning', 'Technology'),
('Web Development', 'Technology'),
('Mobile Development', 'Technology'),
('Blockchain', 'Technology'),
('Cybersecurity', 'Technology'),
('Data Science', 'Technology'),
('Cloud Computing', 'Technology'),
('DevOps', 'Technology'),
('UI/UX Design', 'Design'),
('Graphic Design', 'Design'),
('Product Design', 'Design'),
('Digital Marketing', 'Marketing'),
('Content Marketing', 'Marketing'),
('Social Media Marketing', 'Marketing'),
('E-commerce', 'Business'),
('Entrepreneurship', 'Business'),
('Finance', 'Business'),
('Project Management', 'Business'),
('Healthcare', 'Industry'),
('Education', 'Industry'),
('Gaming', 'Entertainment'),
('Music', 'Entertainment'),
('Photography', 'Creative'),
('Writing', 'Creative'),
('Sustainability', 'Social Impact'),
('Environmental', 'Social Impact'),
('Fitness', 'Health'),
('Mental Health', 'Health'),
('Travel', 'Lifestyle'),
('Food & Beverage', 'Lifestyle'),
('Real Estate', 'Business')
ON CONFLICT (name) DO NOTHING;

-- Insert skills
INSERT INTO skills (name, category) VALUES
('JavaScript', 'Programming Languages'),
('Python', 'Programming Languages'),
('React', 'Frontend Frameworks'),
('Node.js', 'Backend Technologies'),
('SQL', 'Databases'),
('MongoDB', 'Databases'),
('AWS', 'Cloud Platforms'),
('Docker', 'DevOps Tools'),
('Git', 'Development Tools'),
('Figma', 'Design Tools'),
('Adobe Photoshop', 'Design Tools'),
('Project Management', 'Management'),
('Digital Marketing', 'Marketing'),
('SEO', 'Marketing'),
('Content Writing', 'Content Creation'),
('Copywriting', 'Content Creation'),
('Data Analysis', 'Analytics'),
('Financial Modeling', 'Finance'),
('Sales', 'Business Development'),
('Customer Service', 'Operations'),
('Team Leadership', 'Management'),
('Communication', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Public Speaking', 'Soft Skills')
ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT 'Interests inserted:' as info, COUNT(*) as count FROM interests
UNION ALL
SELECT 'Skills inserted:' as info, COUNT(*) as count FROM skills; 