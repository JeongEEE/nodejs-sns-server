const express = require('express')
const multer = require('multer')
const {checkAuthenticated, checkPostOwnerShip} = require('../middleware/auth');
const Comment = require('../models/comments.model');
const router = express.Router()
const Post = require('../models/posts.model')
const Path = require('path');

const storageEngine = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, Path.join(__dirname, '../public/assets/images'));
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  }
})

const upload = multer({ storage: storageEngine }).single('image');

router.post('/', checkAuthenticated, upload, (req, res, next) => {
  let desc = req.body.desc;
  let image = req.file ? req.file.filename : "";

  Post.create({
    image: image,
    description: desc,
    author: {
      id: req.user._id,
      username: req.user.username
    },
  }).then(() => {
    req.flash('success', '포스트 생성 성공');
    res.redirect("back");
  }).catch((err) => {
    req.flash('error', '포스트 생성 실패');
    res.redirect("back");
  })
})

router.get('/', checkAuthenticated, (req, res) => {
  Post.find()
    .populate('comments')
    .sort({ createdAt: -1 })
    .then((posts) => {
      res.render('posts', {
        posts: posts,
      });
    }).catch((error) => {
      console.log(error);
    })
})

router.get('/:id/edit', checkPostOwnerShip, (req, res) => {
  res.render('posts/edit', {
    post: req.post
  })
})

router.put('/:id', checkPostOwnerShip, (req, res) => {
  Post.findByIdAndUpdate(req.params.id, req.body).then(() => {
    req.flash('success', '게시물 수정을 완료했습니다.');
    res.redirect('/posts');
  }).catch((err) => {
    req.flash('error', '게시물을 수정하는데 오류가 발생했습니다.');
    res.redirect('/posts');
  })
})

router.delete('/:id', checkPostOwnerShip, (req, res) => {
  Post.findByIdAndDelete(req.params.id).then(() => {
    req.flash('success', '게시물을 지우는데 성공했습니다.');
    res.redirect('/posts');
  }).catch((err) => {
    req.flash('error', '게시물을 지우는데 실패했습니다.');
    res.redirect('/posts');
  })
})

module.exports = router;