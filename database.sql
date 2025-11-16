CREATE DATABASE IF NOT EXISTS Bimbingan_Online;
USE Bimbingan_Online;

-- TABEL USERS
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('mahasiswa', 'dosen', 'koordinator') NOT NULL,
  sub_role ENUM('pembimbing', 'penguji') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABEL PROPOSALS
CREATE TABLE proposals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  advisor_id INT,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  file_name VARCHAR(255),
  file_data LONGBLOB,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  coordinator_approval_status ENUM('pending_approval', 'approved', 'rejected') DEFAULT NULL,
  advisor_status ENUM('pending_approval', 'approved', 'rejected') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (advisor_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- TABEL GUIDANCE SESSIONS
CREATE TABLE guidance_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL,
  advisor_id INT NOT NULL,
  topic VARCHAR(255) NOT NULL,
  notes LONGTEXT,
  feedback LONGTEXT,
  status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
  approval_status ENUM('approved', 'rejected') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  FOREIGN KEY (advisor_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- TABEL REPORTS
CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL,
  student_id INT NOT NULL,
  file_name VARCHAR(255),
  file_data LONGBLOB,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- TABEL EXAM SUBMISSIONS
CREATE TABLE exam_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL,
  student_id INT NOT NULL,
  file_name VARCHAR(255),
  file_data LONGBLOB,
  status ENUM('submitted', 'under_review', 'approved', 'rejected') DEFAULT 'submitted',
  exam_approval_status ENUM('approved', 'rejected') DEFAULT NULL,
  assessment_status ENUM('pending', 'assessed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- TABEL EXAM ASSESSMENTS
CREATE TABLE exam_assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  submission_id INT NOT NULL,
  assessor_id INT NOT NULL,
  score INT NOT NULL,
  feedback LONGTEXT,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES exam_submissions(id),
  FOREIGN KEY (assessor_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- INDEX TAMBAHAN
CREATE INDEX idx_student_id ON proposals(student_id);
CREATE INDEX idx_advisor_id ON proposals(advisor_id);
CREATE INDEX idx_proposal_id ON guidance_sessions(proposal_id);
CREATE INDEX idx_user_email ON users(email);
