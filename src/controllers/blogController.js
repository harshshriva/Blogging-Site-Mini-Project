const authorModel = require("../model/authorModel");
const blogModel = require("../model/blogModel")

//validation function 
const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
        //will return an array of all keys. so, we can simply get the length of an array with .length
}

//api to create a blog  

const createBlogs = async function(req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(requestBody.title)) {
            res.status(400).send({ status: false, message: 'Blog Title is required' })
            return
        }

        if (!isValid(requestBody.body)) {
            res.status(400).send({ status: false, message: 'Blog body is required' })
            return
        }

        if (!isValid(requestBody.authorId)) {
            res.status(400).send({ status: false, message: 'Author id is required' })
            return
        }

        if (!isValid(requestBody.category)) {
            return res.status(400).send({ status: false, message: 'Blog category is required' })
        }

        if (!requestBody.authorId === requestBody.tokenId) {
            return res.status(400).send({ status: false, msg: "unauthorized access" })
        }

        let Author = await authorModel.findById(requestBody.authorId);
        if (!Author) {
            return res.status(400).send({ status: false, message: "Author_Id not found" });
        }

        requestBody.isPublished = requestBody.isPublished ? requestBody.isPublished : false;
        requestBody.publishedAt = requestBody.isPublished ? new Date() : null;

        let createdBlog = await blogModel.create(requestBody);
        res.status(201).send({ status: true, message: 'New blog created successfully', data: createdBlog });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


// api to get blog by query without query get all blogs 


const getBlogs = async function(req, res) {
    try {

        const check = await blogModel.find({ $and: [{ isDeleted: false }, { isPublished: true }] });
        if (Object.keys(req.query).length === 0) {
            return res.status(200).send({ status: true, data: check });
        }

        let search = await blogModel.find({ $or: [{ authorId: req.query.authorId }, { tags: req.query.tag }, { category: req.query.category }, { subcategory: req.query.subcategory }] });
        let result = []
        if (search.length > 0) {
            for (let element of search) {
                if (element.isDeleted == false && element.isPublished == true) {
                    result.push(element)
                }
            }
            res.status(200).send({ status: true, data: result });
        } else {
            res.status(404).send({ status: false, message: 'No blogs found of that author' })
        }

    } catch (error) {
        res.status(400).send({ status: false, error: error.message });
    }
}

// api to update a blog   
const updateBlogs = async function(req, res) {
    try {
        let requestBody = req.body

        // authorization to check the user is authroized to update blog or not only author can update our own blog.

        const data = await blogModel.findOne({ _id: req.params.blogId, isDeleted: false })

        if (!data) {
            return res.status(404).send({ msg: "blog doesnot exist or already deleted" });
        }
        // authroization to check the author has access to update the blog or not
        if (!(data.authorId == req.body.tokenId)) {
            return res.status(400).send({ status: false, msg: "unauthorized access" })
        }
        let updateData = { PublishedAt: new Date(), isPublished: true }
        if (requestBody.title) {
            if (!isValid(requestBody.title)) {
                return res.status(400).send({ status: false, msg: "please provide correct title" })
            }
            updateData.title = requestBody.title
        }

        if (requestBody.body) {
            if (!isValid(requestBody.body)) {
                return res.status(400).send({ status: false, msg: "please provide correct body" })
            }
            updateData.body = requestBody.body
        }

        if (requestBody.tags) {
            if (!isValid(requestBody.tags) || (requestBody.tags.length === 0)) {
                return res.status(400).send({ status: false, msg: "please provide tag" })
            }
            updateData.$addToSet = { tags: requestBody.tags }
        }

        if (requestBody.subCategory) {
            if (!isValid(requestBody.subCategory)) {
                return res.status(400).send({ status: false, msg: "please provide subCatagory" })
            }
            updateData.$addToSet = { subCategory: requestBody.subCategory }
        }

        let updateblog = await blogModel.findOneAndUpdate({ _id: req.params.blogId, isDeleted: false }, updateData, { new: true })
        res.status(200).send({ msg: "successfully updated", data: updateblog });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


// api to delete a blog by its id 
const deleteBlogByid = async function(req, res) {
    try {
        // authroization 
        const data = await blogModel.findOne({ _id: req.params.blogId, isDeleted: false });
        if (!data) {
            res.status(404).send({ status: false, msg: "blog does not exist or already deleted" });
        }

        if (!(data.authorId == req.body.tokenId)) {
            res.status(400).send({ status: false, msg: "unauthorized access" })
        }

        let deleteBlog = await blogModel.findOneAndUpdate({ _id: req.params.blogId }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        res.status(200).send({ status: true, msg: "sucessfully deleted", data: deleteBlog });

    } catch (error) {

        res.status(500).send({ status: false, msg: error.message });
    }
}

//api to delete blog by query condition  
const deleteBlogByQuerConditoin = async function(req, res) {
    try {
        if (Object.keys(req.query).length === 0) {
            return res.status(400).send({ status: false, msg: 'please provide the query condition' });
        }

        let searchFilter = { authorId: req.body.tokenId }

        if (req.query.authorid) {
            searchFilter.authorid = req.query.authorid
        }

        if (req.query.tag) {
            searchFilter.tag = req.query.tag
        }

        if (req.query.subcategory) {
            searchFilter.subcategory = req.query.subcategory
        }

        if (req.query.isPublished) {
            searchFilter.isPublished = req.query.isPublished
        }

        let check = await blogModel.find(searchFilter);
        if (!check) {
            res.status(400).send({ status: false, msg: "!No blog found or unauthorizes access" });
        }

        let deleteBlogByQuery = await blogModel.updateMany(searchFilter, { isDeleted: true, deletedAt: new Date() });
        res.status(200).send({ status: true, msg: "sucessfully deleted", data: deleteBlogByQuery });

    } catch (error) {
        res.status(400).send({ status: false, msg: error.message });
    }
}
module.exports.getBlogs = getBlogs;
module.exports.deleteBlogByid = deleteBlogByid;
module.exports.deleteBlogByQuerConditoin = deleteBlogByQuerConditoin;
module.exports.updateBlogs = updateBlogs;
module.exports.createBlogs = createBlogs;
//