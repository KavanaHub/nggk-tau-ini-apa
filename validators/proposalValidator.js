import pool from '../config/database.js';

const validateProjectExists = async (projectId) => {
  const conn = await pool.getConnection();
  try {
    const [projects] = await conn.query(
      'SELECT id, project_number FROM projects WHERE id = ?',
      [projectId]
    );
    conn.release();
    
    if (projects.length === 0) {
      return { valid: false, error: 'Project not found' };
    }
    
    return { valid: true, project: projects[0] };
  } catch (error) {
    conn.release();
    throw error;
  }
};

const validateProjectAllowsSubmissionMode = (projectNumber, isGroupSubmission) => {
  const groupEnabledProjects = [1, 2, 3];
  const soloOnlyProjects = ['internship1', 'internship2'];
  
  const projectNum = parseInt(projectNumber);
  
  if (groupEnabledProjects.includes(projectNum)) {
    return { valid: true };
  }
  
  if (soloOnlyProjects.includes(projectNumber) && isGroupSubmission) {
    return { valid: false, error: 'Internships only allow solo submissions' };
  }
  
  return { valid: true };
};

const validateStudentExists = async (studentId) => {
  const conn = await pool.getConnection();
  try {
    const [students] = await conn.query(
      'SELECT id, name, email FROM users WHERE id = ? AND role = ?',
      [studentId, 'mahasiswa']
    );
    conn.release();
    
    if (students.length === 0) {
      return { valid: false, error: 'Student not found' };
    }
    
    return { valid: true, student: students[0] };
  } catch (error) {
    conn.release();
    throw error;
  }
};

const validateStudentInfo = async (student1Id, student2Id, isGroupSubmission) => {
  const student1 = await validateStudentExists(student1Id);
  if (!student1.valid) {
    return student1;
  }
  
  if (isGroupSubmission) {
    if (!student2Id) {
      return { valid: false, error: 'Student 2 ID is required for group submission' };
    }
    
    if (student2Id === student1Id) {
      return { valid: false, error: 'Student 1 and Student 2 cannot be the same for group submission' };
    }
    
    const student2 = await validateStudentExists(student2Id);
    if (!student2.valid) {
      return { valid: false, error: 'Partner student not found' };
    }
    
    return { valid: true, student1: student1.student, student2: student2.student };
  }
  
  if (student2Id && student2Id !== student1Id) {
    return { valid: false, error: 'For solo submission, student 2 should be empty or same as student 1' };
  }
  
  return { valid: true, student1: student1.student };
};

const validateFormData = (title, description, student1Name, student1Npm, student1Program) => {
  const errors = [];
  
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (title && title.length > 255) {
    errors.push('Title must not exceed 255 characters');
  }
  
  if (!description || description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (!student1Name || student1Name.trim() === '') {
    errors.push('Student 1 name is required');
  }
  
  if (!student1Npm || student1Npm.trim() === '') {
    errors.push('Student 1 NPM is required');
  }
  
  if (!student1Program || !['D3', 'D4'].includes(student1Program)) {
    errors.push('Student 1 program must be D3 or D4');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true };
};

const validateGroupMode = async (student1Id, student2Id, groupId) => {
  if (!groupId) {
    return { valid: false, error: 'Group ID is required for group submission' };
  }
  
  const conn = await pool.getConnection();
  try {
    const [groups] = await conn.query(
      `SELECT g.id, COUNT(gm.id) as member_count
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.id = ?
       GROUP BY g.id`,
      [groupId]
    );
    
    if (groups.length === 0) {
      conn.release();
      return { valid: false, error: 'Group not found' };
    }
    
    const group = groups[0];
    
    if (group.member_count !== 2) {
      conn.release();
      return { valid: false, error: 'Group must have exactly 2 members' };
    }
    
    const [members] = await conn.query(
      `SELECT student_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    
    const memberIds = members.map(m => m.student_id);
    
    if (!memberIds.includes(student1Id) || !memberIds.includes(student2Id)) {
      conn.release();
      return { valid: false, error: 'Both students must be members of the selected group' };
    }
    
    conn.release();
    return { valid: true, group };
  } catch (error) {
    conn.release();
    throw error;
  }
};

const validateProposalFile = (file) => {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }
  
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedMimes.includes(file.mimetype)) {
    return { valid: false, error: 'Only PDF and Word documents are allowed' };
  }
  
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must not exceed 10MB' };
  }
  
  return { valid: true };
};

const validateDuplicateProposal = async (projectId, student1Id, student2Id) => {
  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query(
      `SELECT id FROM proposals 
       WHERE project_id = ? AND (student_id = ? OR student2_id = ? OR student_id = ? OR student2_id = ?)
       AND status = 'pending'`,
      [projectId, student1Id, student1Id, student2Id, student2Id]
    );
    
    conn.release();
    
    if (existing.length > 0) {
      return { valid: false, error: 'This project already has a pending proposal with one of these students' };
    }
    
    return { valid: true };
  } catch (error) {
    conn.release();
    throw error;
  }
};

export {
  validateProjectExists,
  validateProjectAllowsSubmissionMode,
  validateStudentExists,
  validateStudentInfo,
  validateFormData,
  validateGroupMode,
  validateProposalFile,
  validateDuplicateProposal
};
