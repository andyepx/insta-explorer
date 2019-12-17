export interface Data {
    id: string;
    user: string;
    comments: number;
    commentsSearch: string;
    likes: number;
    likesSearch: string;
    hashtags: string[];
    hashtagCount: number;
    hasImage: boolean;
}

export interface Dataset {
    select: boolean;
    name: string;
    source: string;
    files: string;
}

export interface LabelValue {
    label: string,
    value: string
}

export type FilterField = 'comments' | 'likes' | 'users' | 'hashtags';