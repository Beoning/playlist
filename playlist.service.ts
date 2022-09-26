import PlaylistEntity from './playlist.entity';
import { Repository, Like, In, getRepository } from 'typeorm';
import { PlaylistInputData, PlaylistSchema } from './playlist.interface';
import TrackEntity from '../track/track.entity';
import UserEntity from '../user/user.entity';
import LikeEntity from '../like/like.entity';

/** Class for working with db(Service) */
class PlaylistService {
    /** @private */
    private playlistRepo: Repository<PlaylistEntity>;
    private trackRepo: Repository<TrackEntity>;

    /**
     * constructor get a repository
     * @param { Repository<PlaylistEntity> } PlaylistRepo
     * @param { Repository<TrackEntity> } TrackRepo
     */
    constructor(playlistRepo: Repository<PlaylistEntity>, trackRepo: Repository<TrackEntity>) {
        this.playlistRepo = playlistRepo;
        this.trackRepo = trackRepo;
    }

    /**
     * Method to get all playlists with pagination
     * @returns { Promise<[playlists: PlaylistEntity[] | PlaylistSchema[] | [], count: number]> } return promise of playlists page
     */
    public async getPlaylistsPage(page: number, limit: number): Promise<[playlists: PlaylistEntity[] | PlaylistSchema[] | [], count: number]> {
        return this.playlistRepo.findAndCount({ relations: ['user', 'tracks', 'tracks.genres', 'tracks.album', 'tracks.artists'], skip: limit * (page - 1), take: limit });
    }

    /**
     * Method to get playlist by id
     * @param { number } id - parameter of searching
     * @returns { Promise<PlaylistEntity | PlaylistSchema | undefined> } return promise of album
     */
    public async getPlaylistById(id: number): Promise<PlaylistEntity | PlaylistSchema | undefined> {
        return this.playlistRepo.findOne({
            where: { id },
            relations: ['user', 'tracks'],
        });
    }

    /**
     * Method to get a list of users playlists
     * @param { number } id - parameter of searching
     * @returns { Promise<PlaylistEntity[] | PlaylistSchema[] | undefined> } return promise of playlists
     */
    public async getPlaylistsByUser(id: number): Promise<PlaylistEntity[] | PlaylistSchema[] | undefined> {
        return this.playlistRepo.createQueryBuilder('playlist').where('playlist.userId = :userId', { userId: id }).orderBy('playlist.id', 'DESC').getMany();
    }

    /**
     * Method to get a list of recommended playlists for user
     * @param { number } id - parameter of searching
     * @returns { Promise<PlaylistEntity[] | PlaylistSchema[] | undefined> } return promise of playlists
     */
    public async getRecommendedPlaylists(id: number): Promise<PlaylistEntity[] | PlaylistSchema[] | undefined> {
        const likedTracks = await getRepository(LikeEntity)
            .createQueryBuilder('like')
            .leftJoinAndSelect('like.track', 'track')
            .where('like.userId = :userId', { userId: id })
            .orderBy('like.trackId', 'DESC')
            .limit(20)
            .getMany();

        const tracks = likedTracks.map((like) => like.track);

        const playlists = await getRepository(PlaylistEntity)
            .createQueryBuilder('playlist')
            .leftJoinAndSelect('playlist.tracks', 'track')
            .where('playlist.tracks = :track', { track: tracks[0] })
            .limit(10)
            .getMany();

        return playlists;
    }

    /**
     * Method to get tracks which title is matched with entered string
     * @param query
     * @returns { Promise<PlaylistSchema[] | [] | PlaylistEntity[]> } return promise of tracks
     */
    public async getPlaylistsBySubstring(query: string, amount: number): Promise<PlaylistSchema[] | [] | PlaylistEntity[]> {
        return this.playlistRepo.find({
            where: {
                title: Like(`${query}%`),
            },
            take: amount,
        });
    }

    /**
     * Method to create album
     * @param { any } data - parameter of creating
     * @returns { Promise<PlaylistEntity | PlaylistSchema | undefined> } return promise of playlist
     */
    public async createPlaylist({ cover, title, description, tracksIds, userId }: PlaylistInputData): Promise<PlaylistEntity | PlaylistSchema | undefined> {
        const playlist = this.playlistRepo.create({ cover, title, description });

        const user = await getRepository(UserEntity).createQueryBuilder('user').where('user.id = :id', { id: userId }).getOne();

        if (!user) {
            throw new Error('User is not found');
        }

        const tracks = await this.trackRepo.find({
            where: { id: In(tracksIds) },
        });

        playlist.tracks = tracks;
        playlist.user = user;
        await this.playlistRepo.save(playlist);
        return playlist;
    }

    /**
     * Method to update playlist
     * @param { number } id - parameter of searching
     * @param { PlaylistRequestSchema } data - parameter of updating
     * @returns { Promise<PlaylistEntity | PlaylistSchema | undefined> } return promise of playlist
     */
    public async updatePlaylist(id: number, { cover, title, description, tracksIds, userId }: PlaylistInputData): Promise<PlaylistEntity | PlaylistSchema | undefined> {
        const tracks = await this.trackRepo.find({
            where: { id: In(tracksIds) },
        });

        const playlist = await this.getPlaylistById(id);

        const user = await getRepository(UserEntity).createQueryBuilder('user').where('user.id = :id', { id: userId }).getOne();

        if (!user) {
            throw new Error('User is not found');
        }

        if (playlist) {
            this.playlistRepo.save({ ...playlist, cover, title, description, tracks, user });
        } else {
            throw new Error('Playlist is not found');
        }

        return this.getPlaylistById(id);
    }

    /**
     * Method to add tracks into existing playlist
     * @param { number } id - parameter of searching
     * @param { number } trackId - parameter of updating
     * @returns { Promise<PlaylistEntity | PlaylistResponseSchema | undefined> } return promise of playlist
     */
    public async addTrackToPlaylist(id: number, trackId: number): Promise<PlaylistEntity | PlaylistSchema | undefined> {
        const [track] = await this.trackRepo.find({
            where: { id: trackId },
        });

        const playlist = await this.getPlaylistById(id);

        if (playlist) {
            await this.playlistRepo.save({
                ...playlist,
                tracks: [...playlist.tracks, track],
            });
        } else {
            throw new Error('Playlist is not found');
        }

        return this.getPlaylistById(id);
    }

    /**
     * Method to delete playlist
     * @param { number } id - parameter of searching
     * @returns { Promise<PlaylistEntity | PlaylistSchema | undefined> } return promise of playlist
     */
    public async deletePlaylist(id: number): Promise<PlaylistEntity | PlaylistSchema | undefined> {
        const playlist = await this.getPlaylistById(id);
        await this.playlistRepo.delete(id);
        return playlist;
    }
}

export default PlaylistService;
