require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const samples = [
  ['MERN Stack Developer', 'TechNova', 'Bengaluru', 'full-time', 'Engineering', ['javascript', 'react', 'node.js', 'mongodb'], 800000, 1400000, 1],
  ['Frontend Intern', 'PixelWorks', 'Remote', 'internship', 'Engineering', ['html', 'css', 'react'], 15000, 25000, 0],
  ['Backend Engineer', 'CloudBase', 'Hyderabad', 'full-time', 'Engineering', ['node.js', 'express', 'mongodb', 'docker'], 900000, 1600000, 2],
  ['React Developer', 'AppForge', 'Pune', 'full-time', 'Engineering', ['react', 'javascript', 'css'], 600000, 1100000, 1],
  ['Data Analyst Intern', 'DataHive', 'Pune', 'internship', 'Data', ['python', 'sql', 'excel'], 12000, 20000, 0],
  ['DevOps Engineer', 'InfraLabs', 'Chennai', 'full-time', 'DevOps', ['aws', 'docker', 'linux'], 1000000, 1800000, 3],
  ['UI/UX Designer', 'PixelWorks', 'Mumbai', 'contract', 'Design', ['figma', 'css'], 500000, 900000, 1],
  ['Python Developer', 'DataHive', 'Remote', 'remote', 'Engineering', ['python', 'django', 'sql'], 700000, 1300000, 2],
  ['Node.js Intern', 'TechNova', 'Bengaluru', 'internship', 'Engineering', ['node.js', 'javascript'], 15000, 22000, 0],
  ['Full Stack Developer', 'AppForge', 'Delhi', 'full-time', 'Engineering', ['react', 'node.js', 'mongodb', 'aws'], 900000, 1700000, 2],
  ['QA Engineer', 'CloudBase', 'Pune', 'part-time', 'Testing', ['jest', 'javascript'], 300000, 600000, 1],
  ['Cloud Support Associate', 'InfraLabs', 'Hyderabad', 'full-time', 'DevOps', ['aws', 'linux'], 450000, 800000, 0],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const recruiter = await User.findOne({ role: 'recruiter' });
  if (!recruiter) {
    console.log('No recruiter found. Register one first.');
  } else {
    await Job.insertMany(
      samples.map(([title, company, location, type, category, skills, salaryMin, salaryMax, experienceMin]) => ({
        title, company, location, type, category, skills, salaryMin, salaryMax, experienceMin,
        description: `${title} at ${company}. Work with a friendly team on real projects.`,
        postedBy: recruiter._id,
      }))
    );
    console.log('Inserted', samples.length, 'jobs for', recruiter.email);
  }
  await mongoose.disconnect();
})();