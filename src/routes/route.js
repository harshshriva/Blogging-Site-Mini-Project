const express = require('express');

const router = express.Router();
const blogController = require("../controllers/blogController")
const authorController = require("../controllers/authorController")





router.post('/createAuthor', authorController.createAuthor);


router.post('/createBlogs', blogController.createBlogs);

router.get('/getBlogs', blogController.getBlogs);

router.put('/updateBlogs/:blogId', blogController.updateBlogs);

router.delete('/blogs/:blogId', blogController.deleteBlogByid);

router.delete('/blogs', blogController.deleteBlogByQuerConditoin);



module.exports = router; //