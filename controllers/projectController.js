import pool from '../config/database.js';

const MAX_GROUP_SIZE = 2;

const selectProject = async (req, res) => {
  try {
    const { project_id, group_name } = req.body;
    const studentId = req.user.id;

    if (!project_id) {
      return res.status(400).json({ message: 'project_id is required' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [projects] = await conn.query(
        'SELECT * FROM projects WHERE id = ? AND status = ?',
        [project_id, 'open']
      );

      if (projects.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Project not found or closed' });
      }

      const [existingMembership] = await conn.query(
        `SELECT gm.id FROM group_members gm
         JOIN groups g ON gm.group_id = g.id
         WHERE gm.student_id = ? AND g.project_id = ?`,
        [studentId, project_id]
      );

      if (existingMembership.length > 0) {
        await conn.rollback();
        return res.status(409).json({ message: 'Student is already in a group for this project' });
      }

      const [existingGroups] = await conn.query(
        `SELECT g.id, COUNT(gm.id) as member_count
         FROM groups g
         LEFT JOIN group_members gm ON g.id = gm.group_id
         WHERE g.project_id = ?
         GROUP BY g.id
         HAVING member_count < ?`,
        [project_id, MAX_GROUP_SIZE]
      );

      let targetGroupId;

      if (existingGroups.length > 0) {
        targetGroupId = existingGroups[0].id;
      } else {
        const defaultGroupName = group_name || `Group-${Date.now()}`;
        const [result] = await conn.query(
          'INSERT INTO groups (project_id, group_name) VALUES (?, ?)',
          [project_id, defaultGroupName]
        );
        targetGroupId = result.insertId;
      }

      await conn.query(
        'INSERT INTO group_members (group_id, student_id) VALUES (?, ?)',
        [targetGroupId, studentId]
      );

      await conn.commit();

      res.status(201).json({
        message: 'Successfully joined project group',
        group_id: targetGroupId,
        project_id: project_id,
        student_id: studentId
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const { project_id, group_name } = req.body;
    const studentId = req.user.id;

    if (!project_id) {
      return res.status(400).json({ message: 'project_id is required' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [projects] = await conn.query(
        'SELECT * FROM projects WHERE id = ? AND status = ?',
        [project_id, 'open']
      );

      if (projects.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Project not found or closed' });
      }

      const [existingMembership] = await conn.query(
        `SELECT gm.id FROM group_members gm
         JOIN groups g ON gm.group_id = g.id
         WHERE gm.student_id = ? AND g.project_id = ?`,
        [studentId, project_id]
      );

      if (existingMembership.length > 0) {
        await conn.rollback();
        return res.status(409).json({ message: 'Student is already in a group for this project' });
      }

      const finalGroupName = group_name || `Group-${Date.now()}`;
      const [result] = await conn.query(
        'INSERT INTO groups (project_id, group_name) VALUES (?, ?)',
        [project_id, finalGroupName]
      );

      const groupId = result.insertId;

      await conn.query(
        'INSERT INTO group_members (group_id, student_id) VALUES (?, ?)',
        [groupId, studentId]
      );

      await conn.commit();

      res.status(201).json({
        message: 'Group created and student added',
        group_id: groupId,
        group_name: finalGroupName,
        project_id: project_id
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { group_id } = req.body;
    const studentId = req.user.id;

    if (!group_id) {
      return res.status(400).json({ message: 'group_id is required' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [groups] = await conn.query(
        'SELECT g.id, g.project_id, COUNT(gm.id) as member_count FROM groups g LEFT JOIN group_members gm ON g.id = gm.group_id WHERE g.id = ? GROUP BY g.id',
        [group_id]
      );

      if (groups.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Group not found' });
      }

      const group = groups[0];

      if (group.member_count >= MAX_GROUP_SIZE) {
        await conn.rollback();
        return res.status(409).json({ message: `Group is full (max ${MAX_GROUP_SIZE} members)` });
      }

      const [existingMembership] = await conn.query(
        `SELECT gm.id FROM group_members gm
         WHERE gm.student_id = ? AND gm.group_id = ?`,
        [studentId, group_id]
      );

      if (existingMembership.length > 0) {
        await conn.rollback();
        return res.status(409).json({ message: 'Student is already a member of this group' });
      }

      const [sameProjectGroup] = await conn.query(
        `SELECT gm.id FROM group_members gm
         JOIN groups g ON gm.group_id = g.id
         WHERE gm.student_id = ? AND g.project_id = ?`,
        [studentId, group.project_id]
      );

      if (sameProjectGroup.length > 0) {
        await conn.rollback();
        return res.status(409).json({ message: 'Student is already in a group for this project' });
      }

      await conn.query(
        'INSERT INTO group_members (group_id, student_id) VALUES (?, ?)',
        [group_id, studentId]
      );

      await conn.commit();

      res.status(200).json({
        message: 'Successfully joined group',
        group_id: group_id,
        student_id: studentId
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const studentId = req.user.id;

    const conn = await pool.getConnection();
    const [groups] = await conn.query(
      `SELECT 
        g.id, g.group_name, g.project_id,
        p.project_number, p.title as project_title,
        COUNT(gm.id) as member_count,
        GROUP_CONCAT(u.name) as member_names
       FROM group_members gm
       JOIN groups g ON gm.group_id = g.id
       JOIN projects p ON g.project_id = p.id
       JOIN users u ON gm.student_id = u.id
       WHERE gm.student_id = ?
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [studentId]
    );
    conn.release();

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectGroups = async (req, res) => {
  try {
    const { project_id } = req.params;

    const conn = await pool.getConnection();
    const [groups] = await conn.query(
      `SELECT 
        g.id, g.group_name, g.project_id,
        COUNT(gm.id) as member_count,
        GROUP_CONCAT(u.name) as member_names,
        GROUP_CONCAT(u.id) as member_ids
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       LEFT JOIN users u ON gm.student_id = u.id
       WHERE g.project_id = ?
       GROUP BY g.id
       ORDER BY g.created_at ASC`,
      [project_id]
    );
    conn.release();

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { group_id } = req.params;

    const conn = await pool.getConnection();
    const [members] = await conn.query(
      `SELECT u.id, u.name, u.email, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.student_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at ASC`,
      [group_id]
    );
    conn.release();

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [projects] = await conn.query(
      `SELECT 
        p.id, p.project_number, p.title, p.description, p.max_members, p.status,
        COUNT(DISTINCT g.id) as group_count,
        COUNT(DISTINCT gm.id) as total_members
       FROM projects p
       LEFT JOIN groups g ON p.id = g.project_id
       LEFT JOIN group_members gm ON g.id = gm.group_id
       GROUP BY p.id
       ORDER BY p.project_number ASC`
    );
    conn.release();

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const studentId = req.user.id;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [members] = await conn.query(
        'SELECT id FROM group_members WHERE group_id = ? AND student_id = ?',
        [group_id, studentId]
      );

      if (members.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Student is not a member of this group' });
      }

      await conn.query(
        'DELETE FROM group_members WHERE group_id = ? AND student_id = ?',
        [group_id, studentId]
      );

      const [remainingMembers] = await conn.query(
        'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
        [group_id]
      );

      if (remainingMembers[0].count === 0) {
        await conn.query('DELETE FROM groups WHERE id = ?', [group_id]);
      }

      await conn.commit();

      res.json({ message: 'Successfully left group' });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  selectProject,
  createGroup,
  joinGroup,
  leaveGroup,
  getMyGroups,
  getProjectGroups,
  getGroupMembers,
  getAllProjects
};
