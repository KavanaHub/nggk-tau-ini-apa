import pool from '../config/database.js';

const assignCoordinator = async (req, res) => {
  try {
    const { coordinator_id, project_type, program_studi, notes } = req.body;
    const kepalaProdiId = req.user.id;

    if (!coordinator_id || !project_type || !program_studi) {
      return res.status(400).json({
        message: 'coordinator_id, project_type, and program_studi are required'
      });
    }

    const validProjectTypes = ['project1', 'project2', 'project3', 'internship1', 'internship2'];
    if (!validProjectTypes.includes(project_type)) {
      return res.status(400).json({
        message: `project_type must be one of: ${validProjectTypes.join(', ')}`
      });
    }

    if (!['D3', 'D4'].includes(program_studi)) {
      return res.status(400).json({
        message: 'program_studi must be either "D3" or "D4"'
      });
    }

    const conn = await pool.getConnection();

    try {
      const [kepala] = await conn.query(
        `SELECT role FROM users WHERE id = ? AND role = 'kepala_prodi'`,
        [kepalaProdiId]
      );

      if (kepala.length === 0) {
        conn.release();
        return res.status(403).json({
          message: 'Only kepala prodi can assign coordinators'
        });
      }

      const [coordinator] = await conn.query(
        `SELECT id, name FROM users WHERE id = ? AND (role = 'koordinator' OR sub_role = 'koordinator')`,
        [coordinator_id]
      );

      if (coordinator.length === 0) {
        conn.release();
        return res.status(404).json({
          message: 'Coordinator not found or user does not have coordinator role'
        });
      }

      const [existing] = await conn.query(
        `SELECT id, coordinator_id FROM coordinator_assignments
         WHERE project_type = ? AND program_studi = ? AND status = 'active'`,
        [project_type, program_studi]
      );

      if (existing.length > 0) {
        await conn.query(
          `UPDATE coordinator_assignments
           SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [existing[0].id]
        );
      }

      const [result] = await conn.query(
        `INSERT INTO coordinator_assignments
         (coordinator_id, project_type, program_studi, assigned_by, notes, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [coordinator_id, project_type, program_studi, kepalaProdiId, notes || null]
      );

      conn.release();

      res.status(201).json({
        message: 'Coordinator assigned successfully',
        assignment: {
          id: result.insertId,
          coordinator_id,
          coordinator_name: coordinator[0].name,
          project_type,
          program_studi,
          assigned_by: kepalaProdiId,
          notes
        }
      });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listCoordinators = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [coordinators] = await conn.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.sub_role,
         GROUP_CONCAT(
           CONCAT(ca.project_type, ':', ca.program_studi)
           SEPARATOR ', '
         ) as assignments,
         COUNT(ca.id) as assignment_count
       FROM users u
       LEFT JOIN coordinator_assignments ca ON u.id = ca.coordinator_id AND ca.status = 'active'
       WHERE u.role = 'koordinator' OR u.sub_role = 'koordinator'
       GROUP BY u.id, u.name, u.email, u.role, u.sub_role
       ORDER BY u.name ASC`
    );

    const coordinatorDetails = await Promise.all(
      coordinators.map(async (coord) => {
        const [assignments] = await conn.query(
          `SELECT
             ca.id,
             ca.project_type,
             ca.program_studi,
             ca.assigned_at,
             ca.notes,
             kp.name as assigned_by_name
           FROM coordinator_assignments ca
           LEFT JOIN users kp ON ca.assigned_by = kp.id
           WHERE ca.coordinator_id = ? AND ca.status = 'active'
           ORDER BY ca.project_type, ca.program_studi`,
          [coord.id]
        );

        return {
          ...coord,
          detailed_assignments: assignments
        };
      })
    );

    conn.release();

    res.json(coordinatorDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const viewStatistics = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const stats = {};

    const [proposalStats] = await conn.query(
      `SELECT
         status,
         COUNT(*) as count
       FROM proposals
       GROUP BY status`
    );
    stats.proposals_by_status = proposalStats;

    const [projectTypeStats] = await conn.query(
      `SELECT
         project_type,
         COUNT(*) as count
       FROM proposals
       WHERE project_type IS NOT NULL
       GROUP BY project_type`
    );
    stats.proposals_by_project_type = projectTypeStats;

    const [programStudiStats] = await conn.query(
      `SELECT
         program_studi,
         COUNT(*) as count
       FROM proposals
       WHERE program_studi IS NOT NULL
       GROUP BY program_studi`
    );
    stats.proposals_by_program_studi = programStudiStats;

    const [validationStats] = await conn.query(
      `SELECT
         coordinator_validated,
         COUNT(*) as count
       FROM proposals
       WHERE coordinator_validated IS NOT NULL
       GROUP BY coordinator_validated`
    );
    stats.coordinator_validation = validationStats;

    const [coordinatorCount] = await conn.query(
      `SELECT COUNT(DISTINCT coordinator_id) as count
       FROM coordinator_assignments
       WHERE status = 'active'`
    );
    stats.active_coordinators = coordinatorCount[0].count;

    const [studentCount] = await conn.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'mahasiswa'`
    );
    stats.total_students = studentCount[0].count;

    const [dosenCount] = await conn.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'dosen'`
    );
    stats.total_dosen = dosenCount[0].count;

    const [pendingValidation] = await conn.query(
      `SELECT COUNT(*) as count
       FROM proposals
       WHERE (coordinator_validated IS NULL OR coordinator_validated = FALSE)
         AND status IN ('pending', 'submitted')`
    );
    stats.pending_coordinator_validation = pendingValidation[0].count;

    const [pendingAdvisor] = await conn.query(
      `SELECT COUNT(*) as count
       FROM proposals
       WHERE coordinator_validated = TRUE
         AND advisor_status = 'pending_approval'`
    );
    stats.pending_advisor_approval = pendingAdvisor[0].count;

    const [recentProposals] = await conn.query(
      `SELECT
         p.id,
         p.title,
         p.project_type,
         p.program_studi,
         p.status,
         p.created_at,
         u.name as student_name,
         u.npm as student_npm
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY p.created_at DESC
       LIMIT 10`
    );
    stats.recent_proposals = recentProposals;

    conn.release();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnassignedProjectTypes = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const projectTypes = ['project1', 'project2', 'project3', 'internship1', 'internship2'];
    const programStudis = ['D3', 'D4'];

    const allCombinations = [];
    projectTypes.forEach(pt => {
      programStudis.forEach(ps => {
        allCombinations.push({ project_type: pt, program_studi: ps });
      });
    });

    const [assigned] = await conn.query(
      `SELECT project_type, program_studi
       FROM coordinator_assignments
       WHERE status = 'active'`
    );

    const assignedSet = new Set(
      assigned.map(a => `${a.project_type}:${a.program_studi}`)
    );

    const unassigned = allCombinations.filter(
      combo => !assignedSet.has(`${combo.project_type}:${combo.program_studi}`)
    );

    conn.release();

    res.json({
      total_combinations: allCombinations.length,
      assigned_count: assigned.length,
      unassigned_count: unassigned.length,
      unassigned_combinations: unassigned
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  assignCoordinator,
  listCoordinators,
  viewStatistics,
  getUnassignedProjectTypes
};
