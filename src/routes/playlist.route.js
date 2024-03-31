import { Router } from "express";

import * as playlistController from '../controllers/playlist.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const playlistRouter = Router()
playlistRouter.use(verifyJWT)

playlistRouter.route('/create/playlist').post(playlistController.createPlaylist)
playlistRouter.route('/updateplaylist/:playlistId').post(playlistController.updatePlaylist)

playlistRouter.route('/deleteplaylist/:playlistId').delete(playlistController.deletePlaylist)

playlistRouter.route('/add/video/:playlistId/:videoId').patch(playlistController.addVideoToPlaylist)

playlistRouter.route('/remove/video/:playlistId/:videoId').patch(playlistController.removeVideoFromPlaylist)


playlistRouter.route('/getplaylist/:playlistId').get(playlistController.getPlaylistById)

playlistRouter.route('/userplaylist/:userId').get(playlistController.userPlaylist)

export default playlistRouter


