-- ========================
-- DATABASE SETUP
-- ========================
CREATE DATABASE IF NOT EXISTS lms
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE lms;

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','teacher','student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- STUDENTS
-- ========================
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course VARCHAR(50) DEFAULT 'BSIT',
  year_level VARCHAR(50) DEFAULT '1st Year',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================
-- TEACHERS
-- ========================
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================
-- SUBJECTS
-- ========================
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  year_level VARCHAR(50) DEFAULT '1st Year',
  course VARCHAR(50) DEFAULT 'BSIT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- ENROLLMENTS
-- ========================
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ========================
-- LESSONS
-- ========================
CREATE TABLE lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ========================
-- QUIZZES
-- ========================
CREATE TABLE quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  max_score INT NOT NULL,
  time_limit_minutes INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

-- ========================
-- QUIZ RESULTS
-- ========================
CREATE TABLE quiz_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT NOT NULL,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ========================
-- ACTIVITIES
-- ========================
CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  allow_from DATE,
  due_date DATE,
  cutoff_date DATE,
  reminder_date DATE,
  deduction_percent DECIMAL(5,2) DEFAULT 0,
  status ENUM('active','inactive','missed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ========================
-- ACTIVITY SUBMISSIONS
-- ========================
CREATE TABLE activity_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  student_id INT NOT NULL,
  file_path VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ========================
-- ATTENDANCE
-- ========================
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present','absent','late','excused') DEFAULT 'present',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ========================
-- INTERVENTIONS
-- ========================
CREATE TABLE interventions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  notes TEXT,
  notify_teacher TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ANNOUNCEMENTS
-- ========================
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- GRADES
-- ========================
CREATE TABLE grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  activity_score DECIMAL(5,2) DEFAULT 0,
  quiz_score DECIMAL(5,2) DEFAULT 0,
  exam_score DECIMAL(5,2) DEFAULT 0,
  final_grade DECIMAL(5,2) DEFAULT 0,
  status ENUM('pass','fail','pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ========================
-- SAMPLE DATA
-- ========================

-- USERS (3 students, 1 teacher, 1 admin)
INSERT INTO users (first_name, last_name, email, password, role) VALUES
('Juan', 'Dela Cruz', 'juan@student.com', MD5('student1'), 'student'),
('Maria', 'Santos', 'maria@student.com', MD5('student2'), 'student'),
('Pedro', 'Reyes', 'pedro@student.com', MD5('student3'), 'student'),
('Ana', 'Lopez', 'ana@teacher.com', MD5('teacher1'), 'teacher'),
('Admin', 'One', 'admin@lms.com', MD5('admin1'), 'admin');

-- STUDENTS
INSERT INTO students (user_id) VALUES
(1), (2), (3);

-- TEACHER
INSERT INTO teachers (user_id, department) VALUES
(4, 'Computer Science');

-- SUBJECT (only Computer Programming 1 for BSIT 1st Year)
INSERT INTO subjects (name, description) VALUES
('Computer Programming 1', 'Introduction to programming concepts');

-- ENROLLMENTS (all students enrolled in Computer Programming 1)
INSERT INTO enrollments (student_id, subject_id) VALUES
(1, 1), (2, 1), (3, 1);

-- LESSONS
INSERT INTO lessons (subject_id, title, content) VALUES
(1, 'Intro to C Programming', 'Variables, loops, and conditionals'),
(1, 'Functions in C', 'Defining and calling functions'),
(1, 'Arrays in C', 'Basics of arrays and indexing');

-- QUIZZES
INSERT INTO quizzes (lesson_id, title, max_score, time_limit_minutes) VALUES
(1, 'Quiz 1: Variables', 100, 30),
(2, 'Quiz 2: Functions', 100, 20),
(3, 'Quiz 3: Arrays', 100, 25);

-- QUIZ RESULTS
INSERT INTO quiz_results (quiz_id, student_id, score) VALUES
(1, 1, 60),
(2, 2, 40),
(3, 3, 85);

-- ACTIVITIES
INSERT INTO activities (subject_id, title, description, allow_from, due_date, cutoff_date, reminder_date, deduction_percent, status) VALUES
(1, 'Activity 1: Hello World', 'Write your first C program', '2025-09-01', '2025-09-05', '2025-09-07', '2025-09-03', 5.00, 'active'),
(1, 'Activity 2: Loops', 'For and while loops practice', '2025-09-06', '2025-09-10', '2025-09-12', '2025-09-08', 5.00, 'active'),
(1, 'Activity 3: Functions', 'Write a function for factorial', '2025-09-11', '2025-09-15', '2025-09-17', '2025-09-13', 10.00, 'inactive');

-- ACTIVITY SUBMISSIONS
INSERT INTO activity_submissions (activity_id, student_id, file_path) VALUES
(1, 1, '/submissions/juan_act1.c'),
(2, 2, '/submissions/maria_act2.c'),
(3, 3, '/submissions/pedro_act3.c');

-- ATTENDANCE
INSERT INTO attendance (student_id, subject_id, attendance_date, status) VALUES
(1, 1, '2025-09-01', 'present'),
(2, 1, '2025-09-01', 'absent'),
(3, 1, '2025-09-01', 'late');

-- INTERVENTIONS
INSERT INTO interventions (student_id, subject_id, notes, notify_teacher) VALUES
(1, 1, 'Needs improvement in quizzes', 1),
(2, 1, 'Absent multiple times', 1),
(3, 1, 'Doing well, keep it up', 0);

-- ANNOUNCEMENTS
INSERT INTO announcements (title, message, created_by) VALUES
('Welcome to Computer Programming 1', 'Welcome to our Computer Programming 1 class! This semester we will be learning the fundamentals of C programming. Please make sure to attend all classes and submit assignments on time.', 4),
('Assignment 1 Due Date', 'Reminder: Assignment 1 (Hello World Program) is due on September 5th. Late submissions will have a 5% deduction per day.', 4),
('Quiz Schedule Update', 'The first quiz on Variables and Data Types has been scheduled for next week. Please review your notes and practice exercises.', 4);

-- GRADES
INSERT INTO grades (student_id, activity_score, quiz_score, exam_score, final_grade, status) VALUES
(1, 85.50, 78.00, 82.00, 81.50, 'pass'),
(2, 72.00, 65.00, 70.00, 69.00, 'fail'),
(3, 92.00, 88.00, 90.00, 90.00, 'pass');