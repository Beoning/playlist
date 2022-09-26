import { Request, Response } from 'express';
import { statusCode } from '../common/httpStatusCode';
import { messages } from '../common/responseMessages';
import { commonResponse } from '../utils/helpers/responsesSchema';
import { deletePhotoOrAudio } from '../utils/helpers/deletePhotoOrAudio';
import logger from '../utils/logger/logger';
import PlaylistService from './playlist.service';
import { PlaylistSchema, RequestUser } from './playlist.interface';
import { FIRST_PAGE, LIMIT_OF_PLAYLISTS } from '../constant';

const PLAYLIST = 'Playlist';

export enum Dowloading {
    IMAGE = 'image',
}

class PlaylistController {
    /** @private */
    private playlistService: PlaylistService;
    /**
     * Constructor get a service
     * @param { PlaylistService } playlistService - service
     */
    constructor(playlistService: PlaylistService) {
        this.playlistService = playlistService;
    }

    /**
     * Method that send all playlists
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either all playlists data or error
     */
    public getPlaylistsPage = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { page = FIRST_PAGE } = req.query;
            const [playlists, count] = await this.playlistService.getPlaylistsPage(Number(page), Number(LIMIT_OF_PLAYLISTS));

            if (!playlists.length) {
                return res.status(statusCode.NOT_FOUND).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.EMPTY_ARR(PLAYLIST)));
            }

            return res.status(statusCode.OK).json(
                commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.GET_ALL(PLAYLIST), {
                    playlists,
                    totalPlaylists: count,
                    lastPage: Math.ceil(count / Number(LIMIT_OF_PLAYLISTS)),
                }),
            );
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };

    /**
     * Method that send playlist by id
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either playlist data or error
     */
    public getPlaylistById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;

            const playlist = await this.playlistService.getPlaylistById(Number(id));

            if (!playlist) {
                return res.status(statusCode.NOT_FOUND).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_FOUND(PLAYLIST)));
            }

            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.GET_ALL(PLAYLIST), playlist));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };

    /**
     * Method sends a list of the users playlists sorting them from last to first.
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either playlist data or error
     */

    public getPlaylistsByUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = req.user as RequestUser;
            if (!user.id) {
                return res.status(statusCode.NOT_AUTHORIZED).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NO_ACCESS));
            }

            const playlists = await this.playlistService.getPlaylistsByUser(user.id);

            if (!playlists) {
                return res.status(statusCode.NOT_FOUND).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_FOUND(PLAYLIST)));
            }

            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.GET_ALL(PLAYLIST), playlists));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };

    /**
     * Method returns a list of the recommended playlists for the user.
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either playlist data or error
     */

    public getRecommendedPlaylists = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = req.user as RequestUser;
            if (!user.id) {
                return res.status(statusCode.NOT_AUTHORIZED).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NO_ACCESS));
            }

            const playlists = await this.playlistService.getRecommendedPlaylists(user.id);

            if (!playlists) {
                return res.status(statusCode.NOT_FOUND).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_FOUND(PLAYLIST)));
            }

            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.GET_ALL(PLAYLIST), playlists));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };

    /**
     * Method that adds track into playlist
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either success message or an error
     */
    public addTrackToPlaylist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const { trackId } = req.query;

            const playlist = await this.playlistService.getPlaylistById(Number(id));

            if (!playlist) {
                return res.status(statusCode.BAD_REQUEST).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_FOUND(PLAYLIST)));
            }

            const editedPlaylist = await this.playlistService.addTrackToPlaylist(Number(id), Number(trackId));

            if (!editedPlaylist) return res.status(statusCode.BAD_REQUEST).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_UPDATED(PLAYLIST)));

            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.UPDATED(PLAYLIST)));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };

    /**
     * Method that add playlist
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either all playlists data or error
     */
    public addPlaylist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const cover = req.file?.path;

            const userId = req.user as RequestUser;

            const { title, description }: PlaylistSchema = req.body;

            const tracksIds = JSON.parse(req.body.tracksIds);

            if (!userId.id) {
                return res.status(statusCode.NOT_AUTHORIZED).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NO_ACCESS));
            }

            const playlist = await this.playlistService.createPlaylist({
                cover,
                title,
                description,
                tracksIds,
                userId: userId.id,
            });

            if (!playlist) {
                if (cover) {
                    deletePhotoOrAudio(cover);
                }
                return res.status(statusCode.BAD_REQUEST).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_CREATED(PLAYLIST)));
            }
            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.CREATED(PLAYLIST)));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };

    /**
     * Method that edit playlist
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either all tracks data or error
     */
    public editPlaylist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;

            const cover = req.file?.path;

            const userId = req.user as RequestUser;

            const { title, description }: PlaylistSchema = req.body;

            const tracksIds = JSON.parse(req.body.tracksIds);

            if (!userId.id) {
                return res.status(statusCode.NOT_AUTHORIZED).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NO_ACCESS));
            }

            const playlist = await this.playlistService.getPlaylistById(Number(id));

            if (cover && playlist?.cover) {
                deletePhotoOrAudio(playlist.cover);
            }

            if (!playlist) {
                if (cover) {
                    deletePhotoOrAudio(cover);
                }
                return res.status(statusCode.BAD_REQUEST).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_FOUND(PLAYLIST)));
            }

            const editedPlaylist = await this.playlistService.updatePlaylist(Number(id), {
                cover,
                title,
                description,
                tracksIds,
                userId: userId.id,
            });

            if (!editedPlaylist) {
                if (cover) {
                    deletePhotoOrAudio(cover);
                }
                return res.status(statusCode.BAD_REQUEST).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_CREATED(PLAYLIST)));
            }

            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.UPDATED(PLAYLIST)));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };
    /**
     * Method that deletes playlist
     * @param { Request } req
     * @param { Response } res
     * @returns { Promise<Response> } return either all playlist's data or error
     */
    public deletePlaylist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;

            const userId = req.user as RequestUser;

            if (!userId.id) {
                return res.status(statusCode.NOT_AUTHORIZED).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NO_ACCESS));
            }

            const playlist = await this.playlistService.getPlaylistById(Number(id));

            if (!playlist) {
                return res.status(statusCode.BAD_REQUEST).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.NOT_FOUND(PLAYLIST)));
            }

            if (playlist && playlist.cover) {
                await deletePhotoOrAudio(playlist.cover);
            }

            await this.playlistService.deletePlaylist(Number(id));

            return res.status(statusCode.OK).json(commonResponse(messages.RESPONSE_STATUS_SUCCESS, messages.DELETE(PLAYLIST)));
        } catch (error) {
            logger.error(error);
            return res.status(statusCode.SERVER_ERROR).json(commonResponse(messages.RESPONSE_STATUS_FAIL, messages.RESPONSE_ERROR));
        }
    };
}

export default PlaylistController;
