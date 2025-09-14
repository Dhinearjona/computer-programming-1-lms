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
-- SEMESTERS
-- ========================
CREATE TABLE semesters (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
academic_year VARCHAR(20) NOT NULL,
start_date DATE NOT NULL,
end_date DATE NOT NULL,
status ENUM('active','inactive','completed') DEFAULT 'active',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- GRADING PERIODS
-- ========================
CREATE TABLE grading_periods (
id INT AUTO_INCREMENT PRIMARY KEY,
semester_id INT NOT NULL,
name ENUM('prelim','midterm','finals') NOT NULL,
start_date DATE NOT NULL,
end_date DATE NOT NULL,
weight_percent DECIMAL(5,2) NOT NULL,
status ENUM('active','inactive','completed') DEFAULT 'active',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- ========================
-- QUIZZES
-- ========================
CREATE TABLE quizzes (
id INT AUTO_INCREMENT PRIMARY KEY,
lesson_id INT NOT NULL,
grading_period_id INT NOT NULL,
title VARCHAR(150) NOT NULL,
max_score INT NOT NULL,
time_limit_minutes INT DEFAULT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (lesson_id) REFERENCES lessons(id),
FOREIGN KEY (grading_period_id) REFERENCES grading_periods(id)
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
grading_period_id INT NOT NULL,
title VARCHAR(150) NOT NULL,
description TEXT,
allow_from DATE,
due_date DATE,
cutoff_date DATE,
reminder_date DATE,
deduction_percent DECIMAL(5,2) DEFAULT 0,
status ENUM('active','inactive','missed') DEFAULT 'active',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (subject_id) REFERENCES subjects(id),
FOREIGN KEY (grading_period_id) REFERENCES grading_periods(id)
);

-- ========================
-- ACTIVITY SUBMISSIONS
-- ========================
CREATE TABLE activity_submissions (
id INT AUTO_INCREMENT PRIMARY KEY,
activity_id INT NOT NULL,
student_id INT NOT NULL,
file_path VARCHAR(255),
submission_link TEXT,
submission_text TEXT,
status ENUM('submitted', 'unsubmitted') DEFAULT 'submitted',
submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
subject_id INT NOT NULL,
semester_id INT NOT NULL,
grading_period_id INT NOT NULL,
activity_score DECIMAL(5,2) DEFAULT 0,
quiz_score DECIMAL(5,2) DEFAULT 0,
exam_score DECIMAL(5,2) DEFAULT 0,
period_grade DECIMAL(5,2) DEFAULT 0,
status ENUM('pass','fail','pending') DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (student_id) REFERENCES students(id),
FOREIGN KEY (subject_id) REFERENCES subjects(id),
FOREIGN KEY (semester_id) REFERENCES semesters(id),
FOREIGN KEY (grading_period_id) REFERENCES grading_periods(id)
);

-- ========================
-- FINAL GRADES
-- ========================
CREATE TABLE final_grades (
id INT AUTO_INCREMENT PRIMARY KEY,
student_id INT NOT NULL,
subject_id INT NOT NULL,
semester_id INT NOT NULL,
prelim_grade DECIMAL(5,2) DEFAULT 0,
midterm_grade DECIMAL(5,2) DEFAULT 0,
finals_grade DECIMAL(5,2) DEFAULT 0,
final_grade DECIMAL(5,2) DEFAULT 0,
status ENUM('pass','fail','pending') DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (student_id) REFERENCES students(id),
FOREIGN KEY (subject_id) REFERENCES subjects(id),
FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- ========================
-- ACTIVITY GRADES
-- ========================
CREATE TABLE activity_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  comments TEXT,
  graded_by INT NOT NULL,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES activity_submissions(id),
  FOREIGN KEY (graded_by) REFERENCES users(id)
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

-- SEMESTER (1st Semester 2025-2026)
INSERT INTO semesters (name, academic_year, start_date, end_date, status) VALUES
('1st Semester', '2025-2026', '2025-08-01', '2025-12-15', 'active');

-- GRADING PERIODS (Prelim, Midterm, Finals)
INSERT INTO grading_periods (semester_id, name, start_date, end_date, weight_percent, status) VALUES
(1, 'prelim', '2025-08-01', '2025-09-30', 30.00, 'completed'),
(1, 'midterm', '2025-10-01', '2025-11-15', 30.00, 'active'),
(1, 'finals', '2025-11-16', '2025-12-15', 40.00, 'pending');

-- -- ENROLLMENTS (all students enrolled in Computer Programming 1)
-- INSERT INTO enrollments (student_id, subject_id) VALUES
-- (1, 1), (2, 1), (3, 1);

-- LESSONS
INSERT INTO lessons (subject_id, title, content) VALUES
(1, 'Intro to C Programming', 'Variables, loops, and conditionals'),
(1, 'Functions in C', 'Defining and calling functions'),
(1, 'Arrays in C', 'Basics of arrays and indexing'),
(1, 'Pointers in C', 'Understanding pointers and memory management'),
(1, 'File Handling in C', 'Reading and writing files'),
(1, 'Data Structures', 'Linked lists, stacks, and queues');

-- QUIZZES (Prelim Period)
INSERT INTO quizzes (lesson_id, grading_period_id, title, max_score, time_limit_minutes) VALUES
(1, 1, 'Prelim Quiz 1: Variables and Data Types', 100, 30),
(2, 1, 'Prelim Quiz 2: Functions', 100, 20);

-- QUIZZES (Midterm Period)
INSERT INTO quizzes (lesson_id, grading_period_id, title, max_score, time_limit_minutes) VALUES
(3, 2, 'Midterm Quiz 1: Arrays', 100, 25),
(4, 2, 'Midterm Quiz 2: Pointers', 100, 30);

-- QUIZZES (Finals Period)
INSERT INTO quizzes (lesson_id, grading_period_id, title, max_score, time_limit_minutes) VALUES
(5, 3, 'Finals Quiz 1: File Handling', 100, 25),
(6, 3, 'Finals Quiz 2: Data Structures', 100, 35);

-- -- QUIZ RESULTS
-- INSERT INTO quiz_results (quiz_id, student_id, score) VALUES
-- (1, 1, 60),
-- (2, 2, 40),
-- (3, 3, 85);

-- ACTIVITIES (Prelim Period)
INSERT INTO activities (subject_id, grading_period_id, title, description, allow_from, due_date, cutoff_date, reminder_date, deduction_percent, status) VALUES
(1, 1, 'Prelim Activity 1: Hello World Program', 'Write your first C program that displays "Hello World"', '2025-08-05', '2025-08-12', '2025-08-14', '2025-08-10', 5.00, 'completed'),
(1, 1, 'Prelim Activity 2: Variables and Input', 'Create a program that accepts user input and displays it', '2025-08-15', '2025-08-22', '2025-08-24', '2025-08-20', 5.00, 'completed'),
(1, 1, 'Prelim Activity 3: Basic Functions', 'Write a function to calculate the area of a circle', '2025-08-25', '2025-09-02', '2025-09-04', '2025-08-30', 5.00, 'completed');

-- ACTIVITIES (Midterm Period)
INSERT INTO activities (subject_id, grading_period_id, title, description, allow_from, due_date, cutoff_date, reminder_date, deduction_percent, status) VALUES
(1, 2, 'Midterm Activity 1: Array Operations', 'Create a program that demonstrates array operations', '2025-10-05', '2025-10-12', '2025-10-14', '2025-10-10', 5.00, 'active'),
(1, 2, 'Midterm Activity 2: Pointer Basics', 'Write a program using pointers to swap two numbers', '2025-10-15', '2025-10-22', '2025-10-24', '2025-10-20', 5.00, 'active'),
(1, 2, 'Midterm Activity 3: String Manipulation', 'Create a program that manipulates strings using pointers', '2025-10-25', '2025-11-02', '2025-11-04', '2025-10-30', 5.00, 'pending');

-- ACTIVITIES (Finals Period)
INSERT INTO activities (subject_id, grading_period_id, title, description, allow_from, due_date, cutoff_date, reminder_date, deduction_percent, status) VALUES
(1, 3, 'Finals Activity 1: File I/O', 'Create a program that reads from and writes to files', '2025-11-20', '2025-11-27', '2025-11-29', '2025-11-25', 5.00, 'pending'),
(1, 3, 'Finals Activity 2: Linked List Implementation', 'Implement a basic linked list with insert and delete operations', '2025-11-30', '2025-12-07', '2025-12-09', '2025-12-05', 5.00, 'pending'),
(1, 3, 'Finals Activity 3: Final Project', 'Create a comprehensive C program demonstrating all concepts learned', '2025-12-01', '2025-12-12', '2025-12-14', '2025-12-10', 10.00, 'pending');

-- -- ACTIVITY SUBMISSIONS
-- INSERT INTO activity_submissions (activity_id, student_id, file_path) VALUES
-- (1, 1, '/submissions/juan_act1.c'),
-- (2, 2, '/submissions/maria_act2.c'),
-- (3, 3, '/submissions/pedro_act3.c');

-- -- ATTENDANCE
-- INSERT INTO attendance (student_id, subject_id, attendance_date, status) VALUES
-- (1, 1, '2025-09-01', 'present'),
-- (2, 1, '2025-09-01', 'absent'),
-- (3, 1, '2025-09-01', 'late');

-- -- INTERVENTIONS
-- INSERT INTO interventions (student_id, subject_id, notes, notify_teacher) VALUES
-- (1, 1, 'Needs improvement in quizzes', 1),
-- (2, 1, 'Absent multiple times', 1),
-- (3, 1, 'Doing well, keep it up', 0);

-- -- ANNOUNCEMENTS
-- INSERT INTO announcements (title, message, created_by) VALUES
-- ('Welcome to Computer Programming 1', 'Welcome to our Computer Programming 1 class! This semester we will be learning the fundamentals of C programming. Please make sure to attend all classes and submit assignments on time.', 4),
-- ('Assignment 1 Due Date', 'Reminder: Assignment 1 (Hello World Program) is due on September 5th. Late submissions will have a 5% deduction per day.', 4),
-- ('Quiz Schedule Update', 'The first quiz on Variables and Data Types has been scheduled for next week. Please review your notes and practice exercises.', 4);

-- SAMPLE GRADES (Prelim Period - Completed)
INSERT INTO grades (student_id, subject_id, semester_id, grading_period_id, activity_score, quiz_score, exam_score, period_grade, status) VALUES
(1, 1, 1, 1, 85.50, 78.00, 82.00, 81.50, 'pass'),
(2, 1, 1, 1, 72.00, 65.00, 70.00, 69.00, 'fail'),
(3, 1, 1, 1, 92.00, 88.00, 90.00, 90.00, 'pass');

-- SAMPLE GRADES (Midterm Period - Active)
INSERT INTO grades (student_id, subject_id, semester_id, grading_period_id, activity_score, quiz_score, exam_score, period_grade, status) VALUES
(1, 1, 1, 2, 88.00, 82.00, 85.00, 85.00, 'pass'),
(2, 1, 1, 2, 75.00, 70.00, 72.00, 72.33, 'pass'),
(3, 1, 1, 2, 95.00, 92.00, 94.00, 93.67, 'pass');

-- SAMPLE GRADES (Finals Period - Pending)
INSERT INTO grades (student_id, subject_id, semester_id, grading_period_id, activity_score, quiz_score, exam_score, period_grade, status) VALUES
(1, 1, 1, 3, 0.00, 0.00, 0.00, 0.00, 'pending'),
(2, 1, 1, 3, 0.00, 0.00, 0.00, 0.00, 'pending'),
(3, 1, 1, 3, 0.00, 0.00, 0.00, 0.00, 'pending');

-- SAMPLE FINAL GRADES (Calculated from all periods)
INSERT INTO final_grades (student_id, subject_id, semester_id, prelim_grade, midterm_grade, finals_grade, final_grade, status) VALUES
(1, 1, 1, 81.50, 85.00, 0.00, 0.00, 'pending'),
(2, 1, 1, 69.00, 72.33, 0.00, 0.00, 'pending'),
(3, 1, 1, 90.00, 93.67, 0.00, 0.00, 'pending');
