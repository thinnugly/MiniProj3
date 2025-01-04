const express = require('express');
let router = express.Router();
const TermsController = require('../controllers/terms.controller');
const AuthController = require("../controllers/auth.controller");

router.route('/')
    .get(TermsController.get);

module.exports = router;