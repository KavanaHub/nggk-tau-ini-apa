/**
 * Test proposal fixtures
 */

export const testProposals = {
  proposal1: {
    id: 1,
    student_id: 1,
    advisor_id: null,
    title: 'Sistem Informasi Manajemen Perpustakaan Berbasis Web',
    description: 'Penelitian ini bertujuan untuk mengembangkan sistem informasi manajemen perpustakaan yang dapat memudahkan pengelolaan buku dan peminjaman.',
    file_name: 'proposal-1.pdf',
    file_data: Buffer.from('Mock PDF content for proposal 1'),
    status: 'pending',
    coordinator_approval_status: null,
    advisor_status: null
  },
  proposal2: {
    id: 2,
    student_id: 2,
    advisor_id: 3,
    title: 'Aplikasi Mobile untuk Monitoring Kesehatan',
    description: 'Pengembangan aplikasi mobile yang dapat membantu pengguna dalam memonitor kesehatan harian mereka.',
    file_name: 'proposal-2.pdf',
    file_data: Buffer.from('Mock PDF content for proposal 2'),
    status: 'approved',
    coordinator_approval_status: 'approved',
    advisor_status: 'approved'
  },
  proposal3: {
    id: 3,
    student_id: 1,
    advisor_id: null,
    title: 'E-Commerce Platform dengan Recommendation System',
    description: 'Membangun platform e-commerce yang dilengkapi dengan sistem rekomendasi produk berbasis machine learning.',
    file_name: 'proposal-3.pdf',
    file_data: Buffer.from('Mock PDF content for proposal 3'),
    status: 'rejected',
    coordinator_approval_status: 'rejected',
    advisor_status: null
  }
};

/**
 * Create a random test proposal
 */
export function createRandomProposal(studentId, overrides = {}) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  return {
    student_id: studentId,
    advisor_id: null,
    title: `Test Proposal ${random}`,
    description: `This is a test proposal created at ${timestamp}`,
    file_name: `proposal-${random}.pdf`,
    file_data: Buffer.from(`Mock PDF content ${random}`),
    status: 'pending',
    coordinator_approval_status: null,
    advisor_status: null,
    ...overrides
  };
}

/**
 * Get proposals array for database seeding (without IDs)
 */
export function getProposalsForSeeding(proposals) {
  return Object.values(proposals).map(({ id, ...proposal }) => proposal);
}
