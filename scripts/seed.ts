// Demo data so the site looks like a real job board: recruiters at fictional companies with postings,
// job seekers with full profiles, resumes and applications at every stage, plus decisions, notifications
// and follows. Also fills in the empty parts of the two team demo accounts.
//
//   pnpm db:seed             adds the data (safe to run again: anything already there is skipped)
//   pnpm db:seed --dry-run   does everything in a transaction, prints what it would add, then rolls back
//
// It only adds: existing rows are never changed, except empty profile fields of the two demo accounts.
import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';
import * as schema from '../src/lib/server/db/schema.ts';

const {
	user, account, profile, companyProfile, experience, education, jobPosting, resume,
	application, applicationOutcome, notification, follow, featureSuggestion
} = schema;

export const DEMO_PASSWORD = 'CareerConnect2026!';
const TEAM_RECRUITER = 'recruiter@email.com';
const TEAM_SEEKER = 'test1@email.com';
const dryRun = process.argv.includes('--dry-run');

// ---- dates relative to today, so deadlines stay in the future whenever this runs ----------------
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const dateIn = (n: number) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);

// ---- the people ----------------------------------------------------------------------------------
type Company = { name: string; description: string; location: string; website: string };
type Posting = {
	key: string;
	title: string;
	location: string;
	employmentType: 'full_time' | 'part_time' | 'internship' | 'coop' | 'contract';
	workMode: 'on_site' | 'hybrid' | 'remote';
	salary: [number, number] | null;
	deadlineInDays: number | null;
	postedDaysAgo: number;
	status?: 'open' | 'closed';
	description: string;
	requirements: string;
};
type Recruiter = {
	name: string;
	email: string;
	jobTitle: string;
	location: string;
	about: string;
	company: Company;
	postings: Posting[];
};

const recruiters: Recruiter[] = [
	{
		name: 'Claire Fontaine',
		email: 'claire.fontaine@careerconnect.test',
		jobTitle: 'Talent Acquisition Lead',
		location: 'Montréal, QC',
		about: 'I hire engineers and designers for Northwind Labs. Happy to answer questions about our internship program.',
		company: {
			name: 'Northwind Labs',
			description:
				'Northwind Labs builds scheduling and logistics software for mid-sized delivery companies across Canada. Our team of 60 works out of a studio in the Mile End, with a strong focus on mentorship and shipping small improvements often.',
			location: 'Montréal, QC',
			website: 'https://northwindlabs.example'
		},
		postings: [
			{
				key: 'northwind-intern',
				title: 'Software Developer Intern (Winter 2027)',
				location: 'Montréal, QC',
				employmentType: 'internship',
				workMode: 'hybrid',
				salary: [48000, 56000],
				deadlineInDays: 24,
				postedDaysAgo: 30,
				description:
					'Join our routing team for a 4-month internship. You will ship features to the dispatcher dashboard used by 300 delivery companies, pair with a senior developer every week, and present your work at our end-of-term demo day.',
				requirements:
					'Currently enrolled in software engineering, computer science or a related program\nComfortable with TypeScript or another typed language\nFamiliar with Git and pull requests\nBilingual (French and English) is an asset'
			},
			{
				key: 'northwind-fullstack',
				title: 'Junior Full-Stack Developer',
				location: 'Montréal, QC',
				employmentType: 'full_time',
				workMode: 'hybrid',
				salary: [68000, 80000],
				deadlineInDays: 40,
				postedDaysAgo: 18,
				description:
					'Build and maintain features across our SvelteKit front end and Node.js services. You will own small projects end to end, from the design review to production, and take part in our on-call rotation after your first three months.',
				requirements:
					'0 to 2 years of experience, internships included\nExperience with a modern front-end framework (Svelte, React or Vue)\nKnowledge of SQL and relational databases\nGood written communication'
			},
			{
				key: 'northwind-designer',
				title: 'Product Designer',
				location: 'Montréal, QC',
				employmentType: 'full_time',
				workMode: 'on_site',
				salary: [72000, 85000],
				deadlineInDays: 15,
				postedDaysAgo: 40,
				status: 'closed',
				description:
					'Design the tools dispatchers use all day. You will run user interviews, prototype in Figma and work closely with developers to ship accessible, well-tested interfaces.',
				requirements: 'A portfolio showing end-to-end product work\nExperience with Figma and design systems\nKnowledge of accessibility guidelines (WCAG)'
			}
		]
	},
	{
		name: 'Daniel Okafor',
		email: 'daniel.okafor@careerconnect.test',
		jobTitle: 'Technical Recruiter',
		location: 'Toronto, ON',
		about: 'Technical recruiter at Maple Health Analytics. I review every application myself and reply within a week.',
		company: {
			name: 'Maple Health Analytics',
			description:
				'Maple Health Analytics helps Canadian hospitals forecast patient demand and staffing needs. We combine clinical expertise with data engineering, and every product goes through a strict privacy review.',
			location: 'Toronto, ON',
			website: 'https://maplehealth.example'
		},
		postings: [
			{
				key: 'maple-data-analyst',
				title: 'Data Analyst',
				location: 'Toronto, ON',
				employmentType: 'full_time',
				workMode: 'hybrid',
				salary: [65000, 78000],
				deadlineInDays: 33,
				postedDaysAgo: 26,
				description:
					'Turn hospital data into dashboards and forecasts that care teams use every morning. You will clean and model data in SQL and Python, and present findings to clinical and operations leads.',
				requirements: 'Strong SQL and Python (pandas)\nExperience with a BI tool such as Power BI or Tableau\nAble to explain results to non-technical people\nDegree in statistics, computer science or a related field'
			},
			{
				key: 'maple-ml-coop',
				title: 'Machine Learning Co-op',
				location: 'Remote (Canada)',
				employmentType: 'coop',
				workMode: 'remote',
				salary: [50000, 58000],
				deadlineInDays: 19,
				postedDaysAgo: 21,
				description:
					'Help our data science team improve the models that predict emergency room admissions. You will run experiments, write evaluation reports and learn how models are validated before they reach hospitals.',
				requirements: 'Enrolled in a co-op program\nExperience with Python and scikit-learn or PyTorch\nCoursework in statistics or machine learning'
			},
			{
				key: 'maple-qa',
				title: 'QA Automation Developer',
				location: 'Toronto, ON',
				employmentType: 'contract',
				workMode: 'hybrid',
				salary: [70000, 82000],
				deadlineInDays: 52,
				postedDaysAgo: 9,
				description:
					'A 12-month contract to grow our automated test suite. You will write end-to-end tests with Playwright, improve our CI pipeline and work with developers to make releases safer.',
				requirements: 'Experience writing automated tests (Playwright, Cypress or Selenium)\nComfortable with JavaScript or TypeScript\nExperience with CI/CD, ideally GitHub Actions'
			}
		]
	},
	{
		name: 'Sofia Ramirez',
		email: 'sofia.ramirez@careerconnect.test',
		jobTitle: 'University Recruitment Manager',
		location: 'Montréal, QC',
		about: 'I run campus recruitment at Lumen Financial. Look for us at the Concordia and McGill career fairs every fall.',
		company: {
			name: 'Lumen Financial',
			description:
				'Lumen Financial is a Montréal fintech that makes budgeting and savings tools for students and young professionals. We are a team of 120 with offices in Montréal and Halifax.',
			location: 'Montréal, QC',
			website: 'https://lumenfinancial.example'
		},
		postings: [
			{
				key: 'lumen-backend',
				title: 'Backend Developer (Java)',
				location: 'Montréal, QC',
				employmentType: 'full_time',
				workMode: 'hybrid',
				salary: [75000, 92000],
				deadlineInDays: 45,
				postedDaysAgo: 14,
				description:
					'Work on the services behind our mobile banking app: payments, savings goals and notifications. You will design APIs, write thorough tests and help keep our systems secure and compliant.',
				requirements: 'Experience with Java and Spring Boot\nKnowledge of REST API design\nUnderstanding of security basics (authentication, input validation)\nExperience with PostgreSQL'
			},
			{
				key: 'lumen-mobile-intern',
				title: 'Mobile Developer Intern',
				location: 'Halifax, NS',
				employmentType: 'internship',
				workMode: 'on_site',
				salary: [46000, 52000],
				deadlineInDays: 28,
				postedDaysAgo: 11,
				description:
					'Build new screens for our iOS and Android apps with React Native. Interns get a dedicated mentor, ship to real users and join our weekly design critiques.',
				requirements: 'Enrolled in a computer science or engineering program\nExperience with React or React Native\nInterest in personal finance products'
			},
			{
				key: 'lumen-support',
				title: 'Customer Support Specialist (Part-time)',
				location: 'Remote (Canada)',
				employmentType: 'part_time',
				workMode: 'remote',
				salary: null,
				deadlineInDays: 60,
				postedDaysAgo: 5,
				description:
					'Help our members by chat and email, 20 hours a week with flexible shifts. A good fit for students who want experience in a fast-growing fintech.',
				requirements: 'Excellent written French and English\nPatient and organized\nAvailable at least two evenings a week'
			}
		]
	},
	{
		name: 'Marc-André Gagnon',
		email: 'marc-andre.gagnon@careerconnect.test',
		jobTitle: 'Engineering Manager',
		location: 'Québec, QC',
		about: 'Engineering manager at Boreal Robotics. I lead the embedded software team and hire for it directly.',
		company: {
			name: 'Boreal Robotics',
			description:
				'Boreal Robotics designs autonomous inspection robots for power lines and wind turbines. Our engineers work across embedded software, computer vision and mechanical design from our lab in Québec City.',
			location: 'Québec, QC',
			website: 'https://borealrobotics.example'
		},
		postings: [
			{
				key: 'boreal-embedded',
				title: 'Embedded Software Engineer',
				location: 'Québec, QC',
				employmentType: 'full_time',
				workMode: 'on_site',
				salary: [80000, 98000],
				deadlineInDays: 38,
				postedDaysAgo: 28,
				description:
					'Write the firmware that keeps our robots safe in the field. You will work in C++ on real-time systems, test on hardware in our lab and occasionally join field trials.',
				requirements: 'Experience with C or C++ on embedded systems\nKnowledge of real-time operating systems\nComfortable with Linux and debugging hardware\nBachelor of Engineering or equivalent'
			},
			{
				key: 'boreal-vision-intern',
				title: 'Computer Vision Intern',
				location: 'Québec, QC',
				employmentType: 'internship',
				workMode: 'hybrid',
				salary: [50000, 56000],
				deadlineInDays: 21,
				postedDaysAgo: 16,
				description:
					'Improve the models that detect damage on turbine blades. You will label data, train models with PyTorch and measure how they perform on images from real inspections.',
				requirements: 'Experience with Python and PyTorch or TensorFlow\nCoursework in computer vision or machine learning\nCurious and careful with data quality'
			},
			{
				key: 'boreal-devops',
				title: 'DevOps Engineer',
				location: 'Remote (Canada)',
				employmentType: 'full_time',
				workMode: 'remote',
				salary: [85000, 105000],
				deadlineInDays: 55,
				postedDaysAgo: 3,
				description:
					'Own the pipelines that build, test and deploy software to our robot fleet. You will work with Docker, Kubernetes and GitHub Actions, and help the team release more often with confidence.',
				requirements: 'Experience with Docker and Kubernetes\nExperience building CI/CD pipelines\nScripting in Bash or Python\nInfrastructure as code (Terraform) is an asset'
			}
		]
	}
];

// postings for the team recruiter account, at whatever company their profile says
const teamRecruiterPostings: Posting[] = [
	{
		key: 'team-web-developer',
		title: 'Web Developer',
		location: 'Montréal, QC',
		employmentType: 'full_time',
		workMode: 'hybrid',
		salary: [62000, 75000],
		deadlineInDays: 35,
		postedDaysAgo: 20,
		description:
			'Build and improve the web applications our clients use every day. You will work across the front end and back end, review pull requests and help decide how new features are built.',
		requirements: 'Experience with JavaScript or TypeScript\nExperience with a front-end framework\nKnowledge of SQL\nGood communication in English; French is an asset'
	},
	{
		key: 'team-it-support',
		title: 'IT Support Technician',
		location: 'Laval, QC',
		employmentType: 'full_time',
		workMode: 'on_site',
		salary: [48000, 56000],
		deadlineInDays: 26,
		postedDaysAgo: 12,
		description:
			'Be the first point of contact for 200 employees. You will set up laptops, manage accounts and solve hardware and software problems, and document fixes for the rest of the team.',
		requirements: 'DEC or AEC in computer support, or equivalent experience\nKnowledge of Windows, macOS and Microsoft 365\nCustomer-service mindset'
	},
	{
		key: 'team-marketing-intern',
		title: 'Marketing Coordinator Intern',
		location: 'Montréal, QC',
		employmentType: 'internship',
		workMode: 'hybrid',
		salary: [40000, 45000],
		deadlineInDays: 30,
		postedDaysAgo: 6,
		description:
			'Help plan our social media and email campaigns, track their results and organize our presence at two career fairs this winter.',
		requirements: 'Enrolled in marketing, communications or business\nStrong writing in French and English\nExperience with Canva or the Adobe suite is an asset'
	}
];

type Job = { title: string; company: string; location: string; start: string; end: string | null; type: string; description: string };
type School = { school: string; degree: string; field: string; start: number; end: number };
type Seeker = {
	name: string;
	email: string;
	headline: string;
	location: string;
	phone: string;
	about: string;
	skills: string[];
	topSkills: string[];
	desiredRoles: string[];
	jobTypes: string[];
	workModes: string[];
	jobs: Job[];
	schools: School[];
	// posting key → status, and how many days ago they applied
	applications: [string, 'applied' | 'under_review' | 'interview' | 'offered' | 'rejected', number][];
};

const seekers: Seeker[] = [
	{
		name: 'Amira Haddad',
		email: 'amira.haddad@careerconnect.test',
		headline: 'Software Engineering student at Concordia | Full-stack developer',
		location: 'Montréal, QC',
		phone: '+1 514 555 0142',
		about: 'Third-year software engineering student who enjoys building web apps end to end. Looking for a Winter 2027 internship where I can ship real features and learn from a strong team.',
		skills: ['TypeScript', 'SvelteKit', 'React', 'Node.js', 'PostgreSQL', 'Git', 'Docker', 'Python', 'Agile Methodologies'],
		topSkills: ['TypeScript', 'SvelteKit', 'PostgreSQL'],
		desiredRoles: ['Software Developer', 'Full-Stack Developer'],
		jobTypes: ['internship', 'coop'],
		workModes: ['hybrid', 'on_site'],
		jobs: [
			{ title: 'Web Developer Intern', company: 'Desjardins', location: 'Montréal, QC', start: '2025-05-01', end: '2025-08-01', type: 'internship', description: '• Built internal dashboards in React used by 40 analysts\n• Wrote integration tests that cut release bugs by a third' },
			{ title: 'Teaching Assistant, Web Programming', company: 'Concordia University', location: 'Montréal, QC', start: '2025-09-01', end: null, type: 'part_time', description: '• Run weekly labs for 60 students\n• Grade assignments and hold office hours' }
		],
		schools: [{ school: 'Concordia University', degree: 'Bachelor of Engineering (BEng)', field: 'Software Engineering', start: 2023, end: 2027 }],
		applications: [['northwind-intern', 'interview', 20], ['lumen-mobile-intern', 'under_review', 9], ['team-web-developer', 'applied', 4]]
	},
	{
		name: 'Lucas Bergeron',
		email: 'lucas.bergeron@careerconnect.test',
		headline: 'Junior backend developer | Java & Spring Boot',
		location: 'Laval, QC',
		phone: '+1 450 555 0187',
		about: 'Recent computer science graduate with a year of co-op experience in backend development. I like clean APIs, good tests and learning from code reviews.',
		skills: ['Java', 'Spring Boot', 'REST APIs', 'PostgreSQL', 'Docker', 'JUnit', 'Git', 'Linux'],
		topSkills: ['Java', 'Spring Boot', 'REST APIs'],
		desiredRoles: ['Backend Developer', 'Software Developer'],
		jobTypes: ['full_time'],
		workModes: ['hybrid', 'remote'],
		jobs: [
			{ title: 'Backend Developer Co-op', company: 'Intact Financial', location: 'Montréal, QC', start: '2024-05-01', end: '2024-12-01', type: 'coop', description: '• Added endpoints to a Spring Boot claims service\n• Raised test coverage of the module from 55% to 82%' }
		],
		schools: [{ school: 'Université de Montréal', degree: 'Bachelor of Science (BSc)', field: 'Computer Science', start: 2021, end: 2025 }],
		applications: [['lumen-backend', 'interview', 12], ['northwind-fullstack', 'rejected', 16], ['team-web-developer', 'under_review', 15]]
	},
	{
		name: 'Priya Nair',
		email: 'priya.nair@careerconnect.test',
		headline: 'Data analyst | SQL, Python and Power BI',
		location: 'Toronto, ON',
		phone: '+1 416 555 0119',
		about: 'Data analyst who turns messy spreadsheets into dashboards people actually use. Interested in health care and public-sector data.',
		skills: ['SQL', 'Python', 'pandas', 'Power BI', 'Tableau', 'Statistics', 'Excel', 'Data Visualization'],
		topSkills: ['SQL', 'Python', 'Power BI'],
		desiredRoles: ['Data Analyst', 'Business Intelligence Analyst'],
		jobTypes: ['full_time', 'contract'],
		workModes: ['hybrid'],
		jobs: [
			{ title: 'Junior Data Analyst', company: 'City of Mississauga', location: 'Mississauga, ON', start: '2024-06-01', end: null, type: 'full_time', description: '• Built Power BI reports on service requests for 12 departments\n• Automated a weekly Excel report with Python, saving 4 hours a week' }
		],
		schools: [{ school: 'University of Toronto', degree: 'Bachelor of Science (BSc)', field: 'Statistics', start: 2020, end: 2024 }],
		applications: [['maple-data-analyst', 'offered', 22], ['lumen-support', 'applied', 2]]
	},
	{
		name: 'Ethan Chen',
		email: 'ethan.chen@careerconnect.test',
		headline: 'Machine learning student at McGill',
		location: 'Montréal, QC',
		phone: '+1 514 555 0163',
		about: 'Computer science student focused on machine learning and computer vision. I have trained models for image classification projects and want to apply them to real-world problems.',
		skills: ['Python', 'PyTorch', 'scikit-learn', 'Machine Learning', 'Computer Vision', 'NumPy', 'Git', 'Linux'],
		topSkills: ['Python', 'PyTorch', 'Computer Vision'],
		desiredRoles: ['Machine Learning Engineer', 'Data Scientist'],
		jobTypes: ['internship', 'coop'],
		workModes: ['remote', 'hybrid'],
		jobs: [
			{ title: 'Research Assistant', company: 'Mila', location: 'Montréal, QC', start: '2025-05-01', end: '2025-08-01', type: 'internship', description: '• Cleaned and labelled 20,000 images for a segmentation dataset\n• Ran baseline experiments and reported results to the lab' }
		],
		schools: [{ school: 'McGill University', degree: 'Bachelor of Science (BSc)', field: 'Computer Science', start: 2023, end: 2027 }],
		applications: [['maple-ml-coop', 'under_review', 13], ['boreal-vision-intern', 'interview', 14]]
	},
	{
		name: 'Chloé Lavoie',
		email: 'chloe.lavoie@careerconnect.test',
		headline: 'UX/UI designer | Accessible product design',
		location: 'Montréal, QC',
		phone: '+1 514 555 0175',
		about: 'Product designer who loves user research and accessible interfaces. I have designed mobile and web apps for startups and non-profits.',
		skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Web Accessibility', 'HTML', 'CSS'],
		topSkills: ['Figma', 'User Research', 'Web Accessibility'],
		desiredRoles: ['Product Designer', 'UX Designer'],
		jobTypes: ['full_time', 'contract'],
		workModes: ['on_site', 'hybrid'],
		jobs: [
			{ title: 'UX Designer', company: 'Studio Mosaïque', location: 'Montréal, QC', start: '2023-09-01', end: null, type: 'full_time', description: '• Led research and design for 3 client apps\n• Built the studio’s shared design system in Figma' }
		],
		schools: [{ school: 'Université du Québec à Montréal', degree: 'Bachelor of Arts (BA)', field: 'Graphic Design', start: 2019, end: 2023 }],
		applications: [['northwind-designer', 'rejected', 35], ['team-marketing-intern', 'applied', 3]]
	},
	{
		name: 'Omar Benali',
		email: 'omar.benali@careerconnect.test',
		headline: 'Embedded systems engineer | C++ and robotics',
		location: 'Québec, QC',
		phone: '+1 418 555 0131',
		about: 'Electrical engineer with experience in firmware and robotics. I enjoy working close to the hardware and testing in the field.',
		skills: ['C++', 'C', 'Embedded Systems', 'Linux', 'ROS', 'Python', 'Git'],
		topSkills: ['C++', 'Embedded Systems', 'ROS'],
		desiredRoles: ['Embedded Software Engineer'],
		jobTypes: ['full_time'],
		workModes: ['on_site'],
		jobs: [
			{ title: 'Firmware Developer', company: 'Laval Instruments', location: 'Laval, QC', start: '2023-01-01', end: '2025-10-01', type: 'full_time', description: '• Wrote firmware for industrial sensors in C\n• Reduced power use of the main board by 18%' }
		],
		schools: [{ school: 'Université Laval', degree: 'Bachelor of Engineering (BEng)', field: 'Electrical Engineering', start: 2018, end: 2022 }],
		applications: [['boreal-embedded', 'offered', 25], ['boreal-devops', 'applied', 2]]
	},
	{
		name: 'Grace Thompson',
		email: 'grace.thompson@careerconnect.test',
		headline: 'DevOps and cloud engineer',
		location: 'Ottawa, ON',
		phone: '+1 613 555 0108',
		about: 'Cloud engineer who automates everything that can be automated. Looking for a remote role on a team that values reliable releases.',
		skills: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Amazon Web Services (AWS)', 'Python', 'Bash', 'Linux'],
		topSkills: ['Kubernetes', 'Terraform', 'GitHub Actions'],
		desiredRoles: ['DevOps Engineer', 'Site Reliability Engineer'],
		jobTypes: ['full_time', 'contract'],
		workModes: ['remote'],
		jobs: [
			{ title: 'Cloud Engineer', company: 'Shopify', location: 'Ottawa, ON', start: '2022-06-01', end: null, type: 'full_time', description: '• Maintain Terraform modules for 40 services\n• Moved CI pipelines to GitHub Actions, halving build times' }
		],
		schools: [{ school: 'Carleton University', degree: 'Bachelor of Engineering (BEng)', field: 'Computer Systems Engineering', start: 2017, end: 2022 }],
		applications: [['boreal-devops', 'under_review', 2], ['maple-qa', 'interview', 7]]
	},
	{
		name: 'Noah Williams',
		email: 'noah.williams@careerconnect.test',
		headline: 'Computer science student | Mobile apps',
		location: 'Halifax, NS',
		phone: '+1 902 555 0154',
		about: 'Second-year computer science student who builds mobile apps on the side. My budgeting app has 500 users on the App Store.',
		skills: ['React Native', 'React', 'JavaScript', 'TypeScript', 'Firebase', 'Swift', 'Git'],
		topSkills: ['React Native', 'TypeScript', 'Firebase'],
		desiredRoles: ['Mobile Developer'],
		jobTypes: ['internship'],
		workModes: ['on_site', 'hybrid'],
		jobs: [
			{ title: 'Freelance Mobile Developer', company: 'Self-employed', location: 'Halifax, NS', start: '2024-09-01', end: null, type: 'freelance', description: '• Built and published a budgeting app in React Native\n• Handle releases on the App Store and Google Play' }
		],
		schools: [{ school: 'Dalhousie University', degree: 'Bachelor of Science (BSc)', field: 'Computer Science', start: 2024, end: 2028 }],
		applications: [['lumen-mobile-intern', 'interview', 10], ['northwind-intern', 'applied', 6]]
	}
];

// the team job seeker account gets these only for whatever it doesn't already have
const teamSeeker = {
	about: 'Software engineering student interested in web development and cloud. I enjoy team projects, clean code and learning new tools quickly.',
	phone: '+1 514 555 0100',
	linkedinUrl: 'https://www.linkedin.com/in/example',
	desiredRoles: ['Software Developer', 'Web Developer'],
	jobTypes: ['internship', 'coop'],
	workModes: ['hybrid'],
	jobs: [
		{ title: 'IT Support Intern', company: 'Collège Dawson', location: 'Montréal, QC', start: '2024-05-01', end: '2024-08-01', type: 'internship', description: '• Supported 300 staff and students with accounts and devices\n• Wrote a troubleshooting guide used by the help desk' }
	] as Job[],
	schools: [{ school: 'Concordia University', degree: 'Bachelor of Engineering (BEng)', field: 'Software Engineering', start: 2023, end: 2027 }] as School[],
	applications: [
		['northwind-fullstack', 'interview', 15],
		['lumen-backend', 'under_review', 10],
		['maple-qa', 'rejected', 8],
		['boreal-devops', 'applied', 1]
	] as Seeker['applications']
};

const outcomeText = {
	offered: {
		message:
			'Thank you for the time you spent with our team during the interviews. Everyone was impressed by your experience and how clearly you explained your past projects, and we would love for you to join us.',
		nextSteps:
			'Reply to this message by the end of next week to accept or decline. We will then send the written offer and book a short call with HR to go over your start date, salary and benefits.'
	},
	rejected: {
		message:
			'Thank you for applying and for your interest in our team. We received many strong applications for this role, and we decided to move forward with candidates whose experience is closer to what the team needs right now. We encourage you to apply to future openings.'
	}
};

const suggestions = [
	{ by: 'amira.haddad@careerconnect.test', status: 'planned' as const, title: 'Save jobs for later', description: 'Add a bookmark button on each job so I can come back to postings I am not ready to apply to yet.', benefit: 'Job seekers would not lose interesting postings while they prepare their applications.' },
	{ by: 'priya.nair@careerconnect.test', status: 'under_review' as const, title: 'Salary filter in job search', description: 'Let job seekers filter postings by a minimum salary.', benefit: 'People could skip postings that do not fit their needs and spend more time on the ones that do.' },
	{ by: 'noah.williams@careerconnect.test', status: 'new' as const, title: 'Interview scheduling', description: 'Let recruiters propose interview times that the candidate can pick from inside CareerConnect.', benefit: 'Fewer emails back and forth, and the interview time would appear next to the application.' }
];

// ---- a simple text resume PDF for each demo job seeker -----------------------------------------
// WinAnsi codes for the few characters outside Latin-1 that the data uses
const WIN_ANSI: Record<string, string> = { '•': '\x95', '–': '\x96', '’': '\x92' };

// long lines are wrapped, or the PDF cuts them off at the page edge
const wrap = (line: string, width = 85): string[] => {
	const out: string[] = [];
	let current = '';
	for (const word of line.split(' ')) {
		if (current && (current + ' ' + word).length > width) {
			out.push(current);
			current = word;
		} else current = current ? `${current} ${word}` : word;
	}
	return [...out, current];
};

function resumePdf(lines: string[]) {
	// PDF strings escape \, ( and ); accented letters use the font's WinAnsi encoding
	const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[•–’]/g, (c) => WIN_ANSI[c]);
	const stream = `BT /F1 11 Tf 14 TL 60 750 Td ${lines.flatMap((l) => wrap(l)).map((l) => `(${esc(l)}) Tj T*`).join(' ')} ET`;
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
		`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
	];
	let pdf = '%PDF-1.4\n';
	const offsets = objects.map((body, i) => {
		const offset = Buffer.byteLength(pdf, 'latin1');
		pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
		return offset;
	});
	const xref = Buffer.byteLength(pdf, 'latin1');
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return Buffer.from(pdf, 'latin1');
}

const month = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const resumeLines = (s: Seeker) => [
	s.name.toUpperCase(),
	`${s.location}  |  ${s.email}  |  ${s.phone}`,
	'',
	'PROFILE',
	s.about,
	'',
	'EXPERIENCE',
	...s.jobs.flatMap((j) => [`${j.title}, ${j.company} (${month(j.start)} - ${j.end ? month(j.end) : 'Present'})`, ...j.description.split('\n')]),
	'',
	'EDUCATION',
	...s.schools.map((e) => `${e.degree}, ${e.field} - ${e.school} (${e.start} - ${e.end})`),
	'',
	'SKILLS',
	s.skills.join(', ')
];

// ---- writing it --------------------------------------------------------------------------------
const added: Record<string, number> = {};
const count = (what: string, n = 1) => (added[what] = (added[what] ?? 0) + n);

class DryRun extends Error {}

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set (run with --env-file=.env)');
	const client = postgres(url, { prepare: false, max: 1 });
	const db = drizzle(client, { schema });
	const uploads: { path: string; pdf: Buffer }[] = [];
	const passwordHash = await hashPassword(DEMO_PASSWORD);

	try {
		await db.transaction(async (tx) => {
			// a demo user, created with a verified email and the demo password, or the existing one
			async function demoUser(email: string, name: string, role: 'job_seeker' | 'recruiter', joinedDaysAgo: number) {
				const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, email));
				if (existing) return { id: existing.id, created: false };
				const id = randomUUID().replaceAll('-', '');
				const at = daysAgo(joinedDaysAgo);
				await tx.insert(user).values({ id, name, email, role, emailVerified: true, onboardedAt: at, createdAt: at, updatedAt: at });
				await tx.insert(account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password: passwordHash, createdAt: at, updatedAt: at });
				count('demo users');
				return { id, created: true };
			}

			async function addJobs(userId: string, jobs: Job[]) {
				if (!jobs.length) return;
				await tx.insert(experience).values(jobs.map((j) => ({ userId, title: j.title, company: j.company, location: j.location, startDate: j.start, endDate: j.end, employmentType: j.type, description: j.description })));
				count('experience entries', jobs.length);
			}
			async function addSchools(userId: string, schools: School[]) {
				if (!schools.length) return;
				await tx.insert(education).values(schools.map((e) => ({ userId, school: e.school, degree: e.degree, fieldOfStudy: e.field, startYear: e.start, endYear: e.end })));
				count('education entries', schools.length);
			}

			// postings, keyed so applications can point at them
			const postings = new Map<string, { id: string; title: string; createdBy: string }>();
			async function addPostings(recruiterId: string, companyName: string, list: Posting[]) {
				for (const p of list) {
					const [existing] = await tx.select({ id: jobPosting.id }).from(jobPosting).where(and(eq(jobPosting.createdBy, recruiterId), eq(jobPosting.title, p.title)));
					let id = existing?.id;
					if (!id) {
						const at = daysAgo(p.postedDaysAgo);
						[{ id }] = await tx
							.insert(jobPosting)
							.values({
								createdBy: recruiterId, title: p.title, company: companyName, location: p.location,
								employmentType: p.employmentType, workMode: p.workMode, description: p.description, requirements: p.requirements,
								status: p.status ?? 'open', published: true,
								applicationDeadline: p.deadlineInDays === null ? null : dateIn(p.deadlineInDays),
								salaryMin: p.salary?.[0] ?? null, salaryMax: p.salary?.[1] ?? null, createdAt: at, updatedAt: at
							})
							.returning({ id: jobPosting.id });
						count('job postings');
					}
					postings.set(p.key, { id: id!, title: p.title, createdBy: recruiterId });
				}
			}

			// ---- recruiters ----
			for (const [i, r] of recruiters.entries()) {
				const { id, created } = await demoUser(r.email, r.name, 'recruiter', 60 - i * 5);
				if (created) {
					await tx.insert(profile).values({ userId: id, company: r.company.name, jobTitle: r.jobTitle, location: r.location, headline: `${r.jobTitle} at ${r.company.name}`, about: r.about });
					await tx.insert(companyProfile).values({ recruiterId: id, ...r.company });
					count('company profiles');
				}
				await addPostings(id, r.company.name, r.postings);
			}

			// the team recruiter: fill empty fields only, add a company profile if missing, add postings
			const [teamRecruiter] = await tx.select({ id: user.id }).from(user).where(eq(user.email, TEAM_RECRUITER));
			if (teamRecruiter) {
				const [p] = await tx.select().from(profile).where(eq(profile.userId, teamRecruiter.id));
				const companyName = p?.company ?? 'Acme Inc.';
				await tx
					.insert(profile)
					.values({ userId: teamRecruiter.id, company: companyName, jobTitle: 'Hiring Manager' })
					.onConflictDoNothing();
				await tx.execute(sql`
					update profile set
						location = coalesce(location, 'Montréal, QC'),
						headline = coalesce(headline, ${`Hiring Manager at ${companyName}`}),
						about = coalesce(about, 'I lead hiring for our product and IT teams. I read every application and try to reply within two weeks.')
					where user_id = ${teamRecruiter.id}`);
				const companyAdded = await tx
					.insert(companyProfile)
					.values({
						recruiterId: teamRecruiter.id,
						name: companyName,
						description: `${companyName} builds business software for retailers across Québec. Our team of 80 develops, supports and hosts the tools our 400 clients use to manage inventory and sales.`,
						location: 'Montréal, QC',
						website: 'https://acme.example'
					})
					.onConflictDoNothing()
					.returning({ id: companyProfile.id });
				count('company profiles', companyAdded.length);
				await addPostings(teamRecruiter.id, companyName, teamRecruiterPostings);
			} else console.warn(`${TEAM_RECRUITER} doesn't exist; skipping its postings`);

			// ---- job seekers ----
			const resumeFor = new Map<string, string | null>();
			const seekerIds = new Map<string, string>();
			for (const [i, s] of seekers.entries()) {
				const { id, created } = await demoUser(s.email, s.name, 'job_seeker', 45 - i * 3);
				seekerIds.set(s.email, id);
				if (created) {
					await tx.insert(profile).values({
						userId: id, headline: s.headline, location: s.location, phone: s.phone, about: s.about,
						skills: s.skills, topSkills: s.topSkills, openToWork: true, desiredRoles: s.desiredRoles,
						jobTypes: s.jobTypes, workModes: s.workModes, preferredLocations: [s.location]
					});
					await addJobs(id, s.jobs);
					await addSchools(id, s.schools);
					const resumeId = randomUUID();
					const pdf = resumePdf(resumeLines(s));
					const fileName = `${s.name.replace(' ', '_')}_Resume.pdf`;
					const storagePath = `${id}/${resumeId}.pdf`;
					await tx.insert(resume).values({ id: resumeId, userId: id, fileName, sizeBytes: pdf.length, storagePath });
					uploads.push({ path: storagePath, pdf });
					count('resumes');
					resumeFor.set(id, resumeId);
				} else {
					const [r] = await tx.select({ id: resume.id }).from(resume).where(eq(resume.userId, id)).limit(1);
					resumeFor.set(id, r?.id ?? null);
				}
			}

			// the team job seeker: fill empty fields, add experience and education only if there's none
			const [teamSeekerRow] = await tx.select({ id: user.id }).from(user).where(eq(user.email, TEAM_SEEKER));
			const teamApplications: [string, Seeker['applications']][] = [];
			if (teamSeekerRow) {
				const sid = teamSeekerRow.id;
				await tx.insert(profile).values({ userId: sid }).onConflictDoNothing();
				await tx.execute(sql`
					update profile set
						about = coalesce(about, ${teamSeeker.about}),
						phone = coalesce(phone, ${teamSeeker.phone}),
						linkedin_url = coalesce(linkedin_url, ${teamSeeker.linkedinUrl}),
						desired_roles = case when cardinality(desired_roles) = 0 then ${sql.param(teamSeeker.desiredRoles)}::text[] else desired_roles end,
						job_types = case when cardinality(job_types) = 0 then ${sql.param(teamSeeker.jobTypes)}::text[] else job_types end,
						work_modes = case when cardinality(work_modes) = 0 then ${sql.param(teamSeeker.workModes)}::text[] else work_modes end
					where user_id = ${sid}`);
				const [{ jobs }] = await tx.select({ jobs: sql<number>`count(*)::int` }).from(experience).where(eq(experience.userId, sid));
				if (jobs === 0) await addJobs(sid, teamSeeker.jobs);
				const [{ schools }] = await tx.select({ schools: sql<number>`count(*)::int` }).from(education).where(eq(education.userId, sid));
				if (schools === 0) await addSchools(sid, teamSeeker.schools);
				const [r] = await tx.select({ id: resume.id }).from(resume).where(eq(resume.userId, sid)).limit(1);
				resumeFor.set(sid, r?.id ?? null);
				teamApplications.push([sid, teamSeeker.applications]);
			} else console.warn(`${TEAM_SEEKER} doesn't exist; skipping its applications`);

			// ---- applications, decisions and notifications ----
			const allApplications: [string, Seeker['applications']][] = [
				...seekers.map((s) => [seekerIds.get(s.email)!, s.applications] as [string, Seeker['applications']]),
				...teamApplications
			];
			for (const [seekerId, list] of allApplications) {
				for (const [key, status, appliedDaysAgo] of list) {
					const job = postings.get(key);
					if (!job) continue; // the team recruiter's postings are skipped if that account is missing
					const applied = daysAgo(appliedDaysAgo);
					const moved = daysAgo(Math.max(0, appliedDaysAgo - 4));
					const [app] = await tx
						.insert(application)
						.values({ jobPostingId: job.id, userId: seekerId, resumeId: resumeFor.get(seekerId) ?? null, status, createdAt: applied, updatedAt: status === 'applied' ? applied : moved })
						.onConflictDoNothing()
						.returning({ id: application.id });
					if (!app) continue; // already applied: leave it as it is
					count('applications');

					const notes: (typeof notification.$inferInsert)[] = [
						{ userId: job.createdBy, type: 'new_application', title: 'New job application', message: `A new application was submitted for "${job.title}".`, link: `/jobs/${job.id}/applications`, dedupeKey: `seed:new:${app.id}`, createdAt: applied, readAt: appliedDaysAgo > 3 ? applied : null }
					];
					if (status === 'under_review' || status === 'interview') {
						const interview = status === 'interview';
						notes.push({
							userId: seekerId,
							type: interview ? 'interview_invitation' : 'application_update',
							title: interview ? 'Application moved to interview' : 'Application under review',
							message: interview
								? `Your application for "${job.title}" has moved to the interview stage. No interview date or time has been scheduled through CareerConnect.`
								: `Your application for "${job.title}" is now under review.`,
							link: '/applications', dedupeKey: `seed:status:${app.id}`, createdAt: moved, readAt: interview ? null : moved
						});
					}
					if (status === 'offered' || status === 'rejected') {
						const offered = status === 'offered';
						await tx.insert(applicationOutcome).values({
							applicationId: app.id, status, createdAt: moved,
							message: outcomeText[status].message,
							nextSteps: offered ? outcomeText.offered.nextSteps : null
						});
						count('decisions (offers and rejections)');
						notes.push({
							userId: seekerId,
							type: offered ? 'job_offer' : 'application_rejected',
							title: offered ? 'Job offer received' : 'Application rejected',
							message: offered ? `You have received a job offer for "${job.title}".` : `Your application for "${job.title}" was rejected.`,
							link: '/applications', dedupeKey: `seed:outcome:${app.id}`, createdAt: moved, readAt: null
						});
					}
					const saved = await tx.insert(notification).values(notes).onConflictDoNothing().returning({ id: notification.id });
					count('notifications', saved.length);
				}
			}

			// ---- follows: job seekers follow the recruiters they applied to, plus a few classmates ----
			const pairs = new Set<string>();
			for (const [seekerId, list] of allApplications) {
				for (const [key] of list.slice(0, 2)) {
					const job = postings.get(key);
					if (job) pairs.add(`${seekerId}|${job.createdBy}`);
				}
			}
			const amira = seekerIds.get('amira.haddad@careerconnect.test')!;
			for (const other of ['ethan.chen@careerconnect.test', 'lucas.bergeron@careerconnect.test', 'noah.williams@careerconnect.test']) {
				pairs.add(`${amira}|${seekerIds.get(other)}`);
				pairs.add(`${seekerIds.get(other)}|${amira}`);
			}
			const follows = [...pairs].map((p) => p.split('|')).filter(([a, b]) => a && b && a !== b);
			const savedFollows = await tx
				.insert(follow)
				.values(follows.map(([followerId, followingId]) => ({ followerId, followingId })))
				.onConflictDoNothing()
				.returning({ id: follow.id });
			count('follows', savedFollows.length);

			// ---- feature suggestions (US-06), once each ----
			for (const s of suggestions) {
				const userId = seekerIds.get(s.by)!;
				const [existing] = await tx.select({ id: featureSuggestion.id }).from(featureSuggestion).where(and(eq(featureSuggestion.userId, userId), eq(featureSuggestion.title, s.title)));
				if (existing) continue;
				await tx.insert(featureSuggestion).values({ userId, title: s.title, description: s.description, benefit: s.benefit, status: s.status });
				count('feature suggestions');
			}

			if (dryRun) throw new DryRun();
		});

		// files go up only once the rows are saved; a failed upload can be fixed by replacing the resume in the app
		const stored = await uploadResumes(uploads);
		console.log(`Uploaded ${stored} of ${uploads.length} resume PDFs.`);
	} catch (e) {
		if (!(e instanceof DryRun)) throw e;
		console.log('Dry run: nothing was saved and no files were uploaded.');
	} finally {
		await client.end();
	}

	console.log(dryRun ? 'Would add:' : 'Added:');
	for (const [what, n] of Object.entries(added)) console.log(`  ${String(n).padStart(3)} ${what}`);
	if (!Object.keys(added).length) console.log('  nothing (the demo data is already there)');
	console.log(`Demo accounts sign in with the password ${DEMO_PASSWORD}`);
}

async function uploadResumes(files: { path: string; pdf: Buffer }[]) {
	const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
	if (!files.length) return 0;
	if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
		console.warn('SUPABASE_URL or SUPABASE_SECRET_KEY is missing, so the resume PDFs were not uploaded.');
		return 0;
	}
	let stored = 0;
	for (const { path, pdf } of files) {
		const res = await fetch(`${SUPABASE_URL}/storage/v1/object/resumes/${path}`, {
			method: 'POST',
			headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
			body: new Uint8Array(pdf)
		});
		if (res.ok) stored++;
		else console.warn(`Upload of ${path} failed (${res.status}): ${await res.text()}`);
	}
	return stored;
}

await main();
