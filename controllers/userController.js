const JwtUtils = require('../utils/jwt.utils')
const userModel = require('../models/userModel')
const visualizationModel = require('../models/visualizationModel')

const store = async function (req, res, next) {
  try {

    let userInfo = await new userModel({
      name: req.body.name,
      email: req.body.email,
      password: await JwtUtils.convertPasswordInBcrypt(req.body.password),
      birthday: req.body.birthday,
      gender: req.body.gender,
      race: req.body.race
    }).save()

    const findQuery = {
      userId: userInfo._id
    }
    let visualizationList = await visualizationModel.find(findQuery)

    userInfo.password = undefined;

    return res.send({
      code: 200,
      token: await JwtUtils.generateJwtToken(userInfo, 864000),
      user: {
        userInfo,
        _id: '0x' + (userInfo._id + '').slice(0, 4) + '...' + (userInfo._id + '').slice(-4),
        cnt: visualizationList.length
      }
    })

  } catch (error) {
    console.log(error)
    return res.send({ code: 500, message: 'Error found in signup ', error })
  }
}

const login = async function (req, res, next) {
  try {
    let user = await userModel.findOne({ email: req.body.email })
    if (user === null) return res.status(404).send({ code: 404, message: 'This user does not exist.' })
    let comparePassword = await JwtUtils.comparePassword(user.password, req.body.password)
    if (comparePassword === false) return res.status(403).send({ code: 403, message: 'Incorrect password.' })

    const findQuery = {
      userId: user._id
    }
    let visualizationList = await visualizationModel.find(findQuery)
    return res.send({
      code: 200,
      token: await JwtUtils.generateJwtToken(user, 864000),
      user: {
        user,
        _id: '0x' + (user._id + '').slice(0, 4) + '...' + (user._id + '').slice(-4),
        cnt: visualizationList.length
      }
    })
  } catch (error) {
    console.log(error)
    return res.send({ code: 500, message: 'Something went wrong in login!' })
  }
}

const getUser = async function (req, res, next) {
  const user = req.user

  const findQuery = {
    userId: user._id
  }
  let visualizationList = await visualizationModel.find(findQuery)

  return res.send({
    code: 200,
    status: true,
    user: {
      user,
      _id: '0x' + (user._id + '').slice(0, 4) + '...' + (user._id + '').slice(-4),
      cnt: visualizationList.length
    }
  })
}

const update = async function (req, res, next) {
  try {
    let newUserData = {}
    if (req.body.birthday) {
      newUserData.birthday = req.body.birthday
    }
    if (req.body.gender) {
      newUserData.gender = req.body.gender
    }
    if (req.body.race) {
      newUserData.race = req.body.race
    }
    if (req.body.email) {
      newUserData.email = req.body.email
    }
    if (req.body.password) {
      newUserData.password = await JwtUtils.convertPasswordInBcrypt(req.body.password)
    }

    let finduser = await userModel.findOne({ _id: req.user.id, email: req.user.email })
    if (finduser === null) return res.status(404).send({ code: 404, message: "This user doesn't exist in our Database." })
    else {
      const updatedUser = await userModel.updateOne({
        _id: req.user.id,
        email: req.user.email
      }, {
        $set: newUserData
      })

      const findQuery = {
        userId: req.user.id
      }
      let visualizationList = await visualizationModel.find(findQuery)

      if (updatedUser.modifiedCount > 0) return res.status(200).send({
        code: 200,
        message: 'User updated Successfully.',
        newUserData: {
          newUserData,
          _id: '0x' + (newUserData._id + '').slice(0, 4) + '...' + (newUserData._id + '').slice(-4),
          cnt: visualizationList.length
        }
      })
      else return res.status(400).send({ code: 400, message: 'Failed.' })
    }
  } catch (error) {
    console.log(error)
    return res.send({ message: 'Something went wrong !', error })
  }
}

const logout = async function (req, res, next) {
  try {
    let finduser = await userModel.findOne({ _id: req.user.id })
    if (finduser === null) return res.status(404).send({ code: 404, message: "This user doesn't exist in our Database." })
    else {
      return res.status(200).send({ code: 200, message: 'Logged Out Successfully.' })
    }
  } catch (error) {
    console.log(error)
    return res.send({ message: 'Something went wrong on logout !', error })
  }
}

module.exports = {
  store: store,
  login: login,
  getUser: getUser,
  update: update,
  logout: logout
}