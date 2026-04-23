const pool = require('../db');

const getAllJobs = async (req, res) => {
  const { search, type, location } = req.query;

  let query = 'SELECT j.*, u.name as employer_name FROM jobs j JOIN users u ON j.employer_id = u.id WHERE 1=1';
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (j.title ILIKE $${params.length} OR j.company ILIKE $${params.length} OR j.description ILIKE $${params.length})`;
  }

  if (type) {
    params.push(type);
    query += ` AND j.type = $${params.length}`;
  }

  if (location) {
    params.push(`%${location}%`);
    query += ` AND j.location ILIKE $${params.length}`;
  }

  query += ' ORDER BY j.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT j.*, u.name as employer_name FROM jobs j JOIN users u ON j.employer_id = u.id WHERE j.id = $1',
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createJob = async (req, res) => {
  const { title, company, location, salary, type, description, requirements } = req.body;

  if (!title || !company || !description) {
    return res.status(400).json({ message: 'Title, company and description are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO jobs (employer_id, title, company, location, salary, type, description, requirements) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.id, title, company, location, salary, type, description, requirements]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateJob = async (req, res) => {
  const { title, company, location, salary, type, description, requirements } = req.body;

  try {
    const check = await pool.query(
      'SELECT employer_id FROM jobs WHERE id = $1',
      [req.params.id]
    );

    if (!check.rows[0]) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (check.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      'UPDATE jobs SET title=$1, company=$2, location=$3, salary=$4, type=$5, description=$6, requirements=$7 WHERE id=$8 RETURNING *',
      [title, company, location, salary, type, description, requirements, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT employer_id FROM jobs WHERE id = $1',
      [req.params.id]
    );

    if (!check.rows[0]) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (check.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, COUNT(a.id) as application_count 
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id 
       WHERE j.employer_id = $1 
       GROUP BY j.id 
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs };