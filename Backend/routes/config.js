import express from 'express';
import { SUBCATEGORY_TAXONOMY } from '../config/subcategoryTaxonomy.js';

const router = express.Router();

router.get('/subcategories', (req, res) => {
  res.json(SUBCATEGORY_TAXONOMY);
});

export default router;
