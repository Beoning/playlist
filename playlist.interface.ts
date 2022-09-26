import { TrackSchema } from '../track/track.interface';
import { UserSchema } from '../user/user.interface';

export interface PlaylistSchema {
    id: number;
    cover?: string;
    title: string;
    description?: string;
    tracks: TrackSchema[] | [];
    user: UserSchema;
}

export interface PlaylistInputData {
    cover?: string;
    title: string;
    description?: string;
    tracksIds: number[] | [];
    userId: number;
}

export interface RequestUser {
    id: number;
}

/**
 * Object for method fineOne()
 * @typedef { Object } WhereObj
 * @property { Object } where -  just for searching
 * @property { number } playlistId - search parameter
 */

export interface WherePlaylistObj {
    where: {
        id: number;
    };
}
