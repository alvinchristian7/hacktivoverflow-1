const User = require('../models/user')
const { compareSync } = require('../helpers/hashPass')
const { sign } = require('../helpers/jwt')
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const transporter = require("../helpers/sendMail.js");

class UserCont {
  static GoogleSignIn(req, res, next) {
    let payload = null
    let newPass = null
    let code = 500
    client.verifyIdToken({
      idToken: req.body.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    })
      .then((ticket) => {
        payload = ticket.getPayload();
        const userid = payload['sub']
        return User.findOne({ email: payload.email })
      })
      .then((row) => {
        if (!row) {
          code = 201
          newPass = randomPass()
          return User.create({
            name: payload.name,
            email: payload.email,
            password: newPass
          })
        }
        else {
          code = 200
          return row
        }
      })
      .then(row => {
        row = row.toObject()
        delete row.password

        let data = {
          'token': sign(row)
        }
        if (newPass)
          data.newPass = newPass

        res.status(code).json(data)
      })
      .catch(next)
  }

  static register(req, res, next) {
    let exclude = ['image_url', '__v', 'createdAt', 'updatedAt']
    let obj = {}

    User.schema.eachPath(path => {
      if (!exclude.includes(path)) {
        if (req.body[path])
          obj[path] = req.body[path]
      }
    })
    if (req.file)
      obj.image_url = req.file.cloudStoragePublicUrl

    User.create(obj)
      .then(row => {
        row = row.toObject()
        delete row.password

        res.status(201).json(row)
      })
      .catch(next)
  }

  static login(req, res, next) {
    User.findOne({
      email: req.body.email,
    })
      .then(row => {
        if (row) {
          let isSame = compareSync(req.body.password, row.password)
          if (isSame) {
            row = row.toObject()
            delete row.password

            res.status(200).json({
              'token': sign(row)
            })
          }
          else next({ code: 422, message: 'Wrong email/password' })
        }
        else
          next({ code: 422, message: 'Wrong email/password' })
      })
      .catch(next)
  }

  static readOne(req, res, next) {
    User.findById(req.decoded._id)
      .then(row => {
        row = row.toObject()
        delete row.password
        console.log('siap');
        console.log(row);

        res.json(row)
      })
      .catch(next)
  }

  static update(req, res, next) {
    let obj = {}
    let exclude = ['image_url', '_id', '__v', 'createdAt', 'updatedAt']
    console.log(req.body);
    
    if (req.method === "PATCH") {
      User.schema.eachPath(path => {
        if (!exclude.includes(path)) {
          if (req.body[path])
            obj[path] = req.body[path]
        }
      })
    }
    else {
      User.schema.eachPath(path => {
        if (!exclude.includes(path)) {
          obj[path] = req.body[path]
        }
      })
    }
    if (req.file) {
      obj.image_url = req.file.cloudStoragePublicUrl
    }

    User.findByIdAndUpdate(req.decoded._id, obj, { new: true })
      .then(row => {
        row = row.toObject()
        delete row.password

        res.json(row)
      })
      .catch(next)
  }
}

module.exports = UserCont