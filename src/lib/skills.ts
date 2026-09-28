// US-04: standard skill names suggested in the skills picker (users can still add their own).
// ponytail: static list; swap for Lightcast Open Skills (33k skills, free API key) if we outgrow it
export const SKILLS = [
	// Programming languages
	'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift',
	'Objective-C', 'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'Dart', 'Elixir', 'Haskell', 'Perl', 'Lua',
	'Julia', 'Assembly', 'Bash', 'PowerShell', 'SQL', 'HTML', 'CSS', 'Sass', 'VHDL', 'Verilog', 'Solidity',
	// Front-end
	'React', 'Next.js', 'Vue.js', 'Nuxt', 'Angular', 'Svelte', 'SvelteKit', 'Solid.js', 'Redux',
	'Tailwind CSS', 'Bootstrap', 'jQuery', 'Web Accessibility', 'Responsive Web Design', 'WebGL',
	'Three.js', 'D3.js', 'Webpack', 'Vite',
	// Back-end
	'Node.js', 'Express.js', 'NestJS', 'Deno', 'Bun', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
	'ASP.NET', '.NET', 'Ruby on Rails', 'Laravel', 'GraphQL', 'REST APIs', 'gRPC', 'WebSockets',
	'Microservices', 'Serverless', 'OAuth', 'Authentication',
	// Mobile
	'iOS Development', 'Android Development', 'React Native', 'Flutter', 'SwiftUI', 'Jetpack Compose',
	'Xamarin', 'Mobile App Development',
	// Databases
	'PostgreSQL', 'MySQL', 'SQLite', 'Microsoft SQL Server', 'Oracle Database', 'MongoDB', 'Redis',
	'Cassandra', 'DynamoDB', 'Elasticsearch', 'Firebase', 'Supabase', 'Neo4j', 'Database Design',
	'Drizzle ORM', 'Prisma',
	// Cloud & DevOps
	'Amazon Web Services (AWS)', 'Microsoft Azure', 'Google Cloud Platform (GCP)', 'Docker', 'Kubernetes',
	'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CI/CD', 'Linux',
	'Linux System Administration', 'Nginx', 'Vercel', 'Netlify', 'Cloudflare', 'Site Reliability Engineering',
	'Monitoring', 'Networking', 'TCP/IP', 'DNS',
	// Tools & practices
	'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Agile Methodologies', 'Scrum', 'Kanban',
	'Test-Driven Development', 'Unit Testing', 'Integration Testing', 'End-to-End Testing', 'Jest', 'Vitest',
	'Playwright', 'Cypress', 'Selenium', 'JUnit', 'pytest', 'Code Review', 'Software Architecture',
	'System Design', 'Design Patterns', 'Object-Oriented Programming', 'Functional Programming',
	'Data Structures', 'Algorithms', 'Software Testing', 'Quality Assurance', 'Debugging', 'Technical Writing',
	'API Design', 'Performance Optimization', 'UML', 'Requirements Analysis', 'Software Documentation',
	// Data & AI
	'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Natural Language Processing',
	'Computer Vision', 'Large Language Models', 'Prompt Engineering', 'Generative AI', 'Retrieval-Augmented Generation',
	'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy', 'Jupyter', 'Data Analysis',
	'Data Science', 'Data Engineering', 'Data Visualization', 'Statistics', 'Big Data', 'Apache Spark',
	'Hadoop', 'Apache Kafka', 'Airflow', 'dbt', 'ETL', 'Data Warehousing', 'Snowflake', 'BigQuery',
	'Tableau', 'Power BI', 'Looker', 'A/B Testing', 'Reinforcement Learning', 'MLOps',
	// Security
	'Cybersecurity', 'Network Security', 'Penetration Testing', 'Application Security', 'Cryptography',
	'Identity and Access Management', 'Security Operations', 'Incident Response', 'OWASP', 'Ethical Hacking',
	// Embedded & hardware
	'Embedded Systems', 'Arduino', 'Raspberry Pi', 'Microcontrollers', 'FPGA', 'PCB Design', 'IoT',
	'Robotics', 'ROS', 'Real-Time Operating Systems', 'Circuit Design', 'Signal Processing',
	// Engineering (non-software)
	'AutoCAD', 'SolidWorks', 'CATIA', 'Revit', 'ANSYS', 'Simulink', 'LabVIEW', 'Mechanical Engineering',
	'Electrical Engineering', 'Civil Engineering', 'Structural Analysis', 'Thermodynamics', 'CAD',
	'Finite Element Analysis', '3D Printing', 'Manufacturing', 'Lean Manufacturing', 'Six Sigma',
	'Quality Control', 'Project Engineering',
	// Game & graphics
	'Unity', 'Unreal Engine', 'Game Development', 'Game Design', 'Blender', 'Maya', '3D Modeling',
	'Computer Graphics', 'Shader Programming',
	// Design
	'Figma', 'Adobe XD', 'Sketch', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign',
	'Adobe Premiere Pro', 'Adobe After Effects', 'Canva', 'UI Design', 'UX Design', 'User Research',
	'Wireframing', 'Prototyping', 'Interaction Design', 'Visual Design', 'Graphic Design', 'Typography',
	'Branding', 'Motion Design', 'Design Systems', 'Usability Testing', 'Illustration', 'Video Editing',
	'Photography',
	// Product & project
	'Product Management', 'Project Management', 'Program Management', 'Product Strategy', 'Roadmapping',
	'Stakeholder Management', 'Risk Management', 'Budgeting', 'Business Analysis', 'Process Improvement',
	'Change Management', 'PMP', 'Microsoft Project', 'Asana', 'Trello', 'Notion',
	// Business & office
	'Microsoft Excel', 'Microsoft Word', 'Microsoft PowerPoint', 'Microsoft Office', 'Google Workspace',
	'Google Sheets', 'Data Entry', 'Customer Service', 'Customer Success', 'Sales', 'Business Development',
	'Account Management', 'Negotiation', 'CRM', 'Salesforce', 'HubSpot', 'SAP', 'ERP', 'Operations Management',
	'Supply Chain Management', 'Logistics', 'Procurement', 'Inventory Management', 'Entrepreneurship',
	'Strategic Planning', 'Market Research', 'Consulting', 'Administrative Support', 'Event Planning',
	// Marketing & communications
	'Digital Marketing', 'Social Media Marketing', 'Content Marketing', 'Content Writing', 'Copywriting',
	'Search Engine Optimization (SEO)', 'Search Engine Marketing (SEM)', 'Google Analytics', 'Google Ads',
	'Email Marketing', 'Marketing Strategy', 'Brand Management', 'Public Relations', 'Communications',
	'Community Management', 'WordPress', 'Shopify', 'E-commerce', 'Growth Marketing',
	// Finance & accounting
	'Accounting', 'Financial Analysis', 'Financial Modeling', 'Bookkeeping', 'QuickBooks', 'Auditing',
	'Taxation', 'Corporate Finance', 'Investment Banking', 'Valuation', 'Excel Modeling', 'Forecasting',
	'Payroll', 'Financial Reporting', 'Economics',
	// People & HR
	'Human Resources', 'Recruiting', 'Talent Acquisition', 'Sourcing', 'Interviewing', 'Onboarding',
	'Employee Relations', 'Training and Development', 'Compensation and Benefits', 'HRIS', 'Workday',
	'Applicant Tracking Systems',
	// Health & science
	'Research', 'Laboratory Skills', 'Data Collection', 'Scientific Writing', 'Biology', 'Chemistry',
	'Physics', 'Mathematics', 'Bioinformatics', 'Clinical Research', 'Healthcare', 'Patient Care', 'First Aid',
	// Education
	'Teaching', 'Tutoring', 'Curriculum Development', 'Mentoring', 'Coaching', 'Public Speaking',
	'Presentation Skills', 'Workshop Facilitation',
	// Soft skills
	'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Critical Thinking', 'Time Management',
	'Adaptability', 'Creativity', 'Attention to Detail', 'Collaboration', 'Conflict Resolution',
	'Decision Making', 'Emotional Intelligence', 'Organization', 'Self-Motivation', 'Work Ethic',
	'Interpersonal Skills', 'Analytical Skills', 'Multitasking', 'Active Listening', 'Written Communication',
	'Cross-Functional Collaboration', 'Team Leadership', 'People Management',
	// Languages
	'English', 'French', 'Spanish', 'Arabic', 'Mandarin', 'Cantonese', 'Portuguese', 'Italian', 'German',
	'Russian', 'Hindi', 'Punjabi', 'Urdu', 'Persian', 'Tagalog', 'Vietnamese', 'Korean', 'Japanese',
	'Bilingual (English/French)'
];
