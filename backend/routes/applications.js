const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { applyToJob, getMyApplications, getApplicationsForJob, updateApplicationStatus } = require('../controllers/applicationController');
const { auth, requireRole } = require('../middleware/auth');