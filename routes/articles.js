var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:URN', function(req, res, next) {
  console.log(req.params.URN)
  res.send('Requested article ' + req.params.URN);
});

module.exports = router;
