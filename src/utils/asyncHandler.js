
// means mere method me apna function pass krdena mai execute krke de dunga 
// Using Promises
const asyncHandler = (fun_which_execute) => {
    return (req, res, next) => {
        Promise.resolve
            (
                fun_which_execute(req, res, next)
            )
            .catch((error) => next(error))
    }
}

// Using Async Await

// Higher Order Function
// const asyncHandler = (fun) => { }

// Pass fun to another function 
// const asyncHandler = (fun) => () => { }

const asyncHandler1 = (fun_which_execute) => async (req, res, next) => {
    try {
        await fun_which_execute(req, res, next)
    }
    catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export { asyncHandler }
// export { asyncHandler  , asyncHandler1}