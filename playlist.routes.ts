import { Router } from 'express';
import { Repository, getRepository } from 'typeorm';
import { uploadImage } from '../middlewares/multer/multer.handlers';
import PlaylistEntity from './playlist.entity';
import PlaylistService from './playlist.service';
import { playlistDescriptionValidationSchema, playlistTitleValidationSchema } from './playlist.validation';
import PlaylistController from './playlist.controller';
import TrackEntity from '../track/track.entity';
import passport from '../middlewares/passport/passport';
import { validateRequestSchema } from '../middlewares/validateRequestSchema';

/**
 * Сlass for creating routes
 */
class PlaylistRoutes {
    /** @private */
    private playlistController: PlaylistController;

    /** @private */
    private playlistService: PlaylistService;

    public router = Router();
    public trackRepo: Repository<TrackEntity>;
    public repository: Repository<PlaylistEntity>;

    constructor() {
        this.repository = getRepository(PlaylistEntity);
        this.trackRepo = getRepository(TrackEntity);

        this.playlistService = new PlaylistService(this.repository, this.trackRepo);
        this.playlistController = new PlaylistController(this.playlistService);
        this.initializeRoutes();
    }

    /**
     * function initialize all playlist routes
     * @returns void
     */
    public initializeRoutes(): void {
        this.router.get('/playlists', this.playlistController.getPlaylistsPage);
        this.router.get('/playlists/recommended', passport, this.playlistController.getRecommendedPlaylists);
        this.router.get('/playlists/user', passport, this.playlistController.getPlaylistsByUser);
        this.router.get('/playlists/:id', this.playlistController.getPlaylistById);
        this.router.put('/playlists/addtrack/:id', this.playlistController.addTrackToPlaylist);
        this.router.post('/playlists', passport, uploadImage, playlistTitleValidationSchema, playlistDescriptionValidationSchema, validateRequestSchema, this.playlistController.addPlaylist);
        this.router.put('/playlists/:id', passport, uploadImage, playlistTitleValidationSchema, playlistDescriptionValidationSchema, validateRequestSchema, this.playlistController.editPlaylist);
        this.router.delete('/playlists/:id', passport, this.playlistController.deletePlaylist);
    }
}

export default PlaylistRoutes;
