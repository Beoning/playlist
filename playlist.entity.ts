import { BaseEntity, Column, Entity, JoinTable, OneToMany, ManyToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import TrackEntity from '../track/track.entity';
import LikeEntity from '../like/like.entity';
import UserEntity from '../user/user.entity';

@Entity('playlist')
class PlaylistEntity extends BaseEntity {
    constructor(id: number, cover: string, title: string, description: string, tracks: TrackEntity[], likes: LikeEntity[], user: UserEntity, likesCount: number) {
        super();
        this.id = id;
        this.cover = cover;
        this.title = title;
        this.description = description;
        this.tracks = tracks;
        this.likes = likes;
        this.user = user;
        this.likesCount = likesCount;
    }

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        nullable: true,
    })
    public cover: string;

    @Column()
    public title: string;

    @Column('text', {
        nullable: true,
    })
    public description: string;

    @Column({
        default: 0,
    })
    public likesCount: number;

    @ManyToMany(() => TrackEntity, (track) => track.playlists, { cascade: true })
    @JoinTable()
    public tracks: TrackEntity[];

    @OneToMany(() => LikeEntity, (like) => like.playlist)
    public likes: LikeEntity[];

    @ManyToOne(() => UserEntity, (user) => user.playlists, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    public user: UserEntity;
}

export default PlaylistEntity;
