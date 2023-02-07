import User from '../models/User.js'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError,UnAuthenticatedError } from '../errors/index.js'
import attachCookie from '../utils/attachCookies.js'

const register = async (req,res) => {
    const {name,email,password} = req.body

    if(!name || !email || !password){
        throw new BadRequestError('please provide all the values')
        //everytime we use CustomAPIError we will send badrequest error
    }
    const userAlreadyExists = await User.findOne({email});
    if(userAlreadyExists){
        throw new BadRequestError('Email already in use')
    }
    const user = await User.create({name, email, password})
    
    const token = user.createJWT()
    attachCookie({ res,token})
    //############## let's create function for this #################
    // const oneDay = 1000 *60*60*24

    // res.cookie('token',token,{
    //     httpOnly:true,
    //     expires:new Date(Date.now() + oneDay),
    //     secure: process.env.NODE_ENV
    // })//ONCE cookies expire the cookie will finish jwt will not be located over there 
    res.status(StatusCodes.CREATED).json({ user:{email:user.email,
        lastName:user.lastName,
        location:user.location,
        name:user.name
    },
        location:user.location }) //remove token
}

// without async-wrapper 
// const register = async (req,res, next) => {
//     try {
//         const user = User.create(req.body)
//         res.status(201).json({user})
//     } catch (error) {
//         // res.status(500).json({msg:'there was an error'})
//         next(error)
//     }
// }

const login = async (req,res) => {
    const {email,password} = req.body
    if(!email,!password){
        throw new BadRequestError('please provide all values')
    }
    const user = await User.findOne({email}).select('+password')
    if(!user){
        throw new UnAuthenticatedError('Invalid Credentials , no user!')
    }
    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect){
        throw new UnAuthenticatedError('Invalid Credentials , no match password!')
    }
    //then setting up token sending back response
    const token = user.createJWT()
    user.password = undefined
    attachCookie({ res,token})

    res.status(StatusCodes.OK).json({user,location:user.location})
}
const updateUser = async (req,res) => {
    const { email,name,lastName,location } = req.body
    if(!email || !name || !lastName || !location){
        throw new BadRequestError('please provide all the values')
    }
    const user = await User.findOne({_id:req.user.userId})

    user.email = email
    user.name = name
    user.lastName = lastName
    user.location = location

    await user.save()
    
    const token = user.createJWT()
    attachCookie({ res,token})

    res.status(StatusCodes.OK).json({user,location:user.location})

}
const getCurrentUser = async(req,res) => {
    const user = await User.findOne({_id:req.user.userId})
    res.status(StatusCodes.OK).json({ user, location:user.location})
}
const logoutUser = async(req,res) => {
    res.cookie('token','logout',{
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.status(StatusCodes.OK).json({msg:'user logged out!'})
}

export { register, login, updateUser,getCurrentUser,logoutUser}