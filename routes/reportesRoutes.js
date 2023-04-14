import express from 'express';
import { indexPage } from '../controllers/reportesController.js';
import { reportesMicrosip } from '../controllers/reportesController.js';

const router = express.Router();
router.get('/', indexPage);
router.post('/reportesMicrosip', reportesMicrosip)

export default router;